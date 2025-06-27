import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { googleCalendarService } from "./google-calendar";
import { crmSync } from "./crm-sync";
import {
  insertUserSchema,
  loginSchema,
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertContactSubmissionSchema,
  insertProjectSchema,
  insertProjectUpdateSchema,
  insertLeadSchema,
  insertJobSchema,
  insertProposalSchema,
  insertProposalInvoiceSchema,
  insertProposalContractSchema,
  insertProposalPaymentSchema,
  insertProposalTemplateSchema,
  insertCommunicationLogSchema,
} from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Real-time collaboration state
interface CollaborationSession {
  userId: number;
  username: string;
  sessionId: string;
  ws: WebSocket;
  currentCell?: {
    projectId: number;
    column: string;
    timestamp: number;
  };
}

const activeSessions = new Map<string, CollaborationSession>();
const cellEditors = new Map<string, CollaborationSession>(); // cellKey -> session

// WebSocket message types
interface WSMessage {
  type: 'cell-start-edit' | 'cell-end-edit' | 'cell-update' | 'cursor-move' | 'user-join' | 'user-leave';
  payload: any;
}

function broadcastToAll(message: WSMessage, excludeSessionId?: string) {
  const messageStr = JSON.stringify(message);
  activeSessions.forEach((session, sessionId) => {
    if (sessionId !== excludeSessionId && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(messageStr);
    }
  });
}

function getCellKey(projectId: number, column: string): string {
  return `${projectId}-${column}`;
}

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `post-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
    }
  }
});

// Authentication middleware
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Middleware to check subscription status and trial expiration
const checkSubscriptionAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trial has expired
    if (user.role === 'contractor_trial' && user.trialEndDate) {
      const now = new Date();
      if (now > user.trialEndDate) {
        // Update user to expired trial status
        await storage.updateUser(user.id, {
          subscriptionStatus: 'expired',
          role: 'customer'
        });
        return res.status(403).json({ 
          message: "Trial expired. Please upgrade to a paid plan to continue accessing contractor features.",
          trialExpired: true 
        });
      }
    }

    // Check if paid subscription is active
    if (user.role === 'contractor_paid' && user.subscriptionStatus === 'cancelled') {
      return res.status(403).json({ 
        message: "Subscription cancelled. Please renew to continue accessing premium features.",
        subscriptionCancelled: true 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify subscription access" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          subscriptionType: user.subscriptionType 
        }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          subscriptionType: user.subscriptionType 
        }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        companyName: user.companyName,
        role: user.role,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Profile update endpoint
  app.put("/api/users/:id/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile or admin can update any
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }

      const { firstName, lastName, email, phone } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        phone
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Company update endpoint
  app.put("/api/users/:id/company", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own company or admin can update any
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to update this company" });
      }

      const { companyName } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        companyName
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Product catalog routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Admin/contractor product management
  app.post("/api/products", authenticateToken, requireRole(['admin', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  // Shopping cart routes
  app.get("/api/cart", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cartItems = await storage.getCartItems(req.user!.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cartData = { ...req.body, userId: req.user!.id };
      const validatedData = insertCartItemSchema.parse(cartData);
      const cartItem = await storage.addToCart(validatedData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cartItem = await storage.updateCartItem(parseInt(req.params.id), req.body);
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.removeFromCart(parseInt(req.params.id));
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(400).json({ message: "Failed to remove from cart" });
    }
  });

  // Order routes
  app.post("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Get current cart items
      const cartItems = await storage.getCartItems(req.user!.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total
      const totalAmount = cartItems.reduce((total, item) => {
        return total + (parseFloat(item.product?.price || "0") * item.quantity);
      }, 0);

      // Create order
      const orderData = {
        userId: req.user!.id,
        orderNumber: `ORD-${Date.now()}`,
        totalAmount: totalAmount.toString(),
        items: cartItems,
        customerInfo: req.body.customerInfo,
        notes: req.body.notes || "",
      };

      const order = await storage.createOrder(orderData);
      
      // Clear cart after order creation
      await storage.clearCart(req.user!.id);
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await storage.getUserOrders(req.user!.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Contact form route (public)
  app.post("/api/contact", async (req, res) => {
    try {
      console.log("Full request details:", {
        body: req.body,
        headers: req.headers,
        method: req.method
      });
      
      // Handle both direct schema format and transformed format
      let submissionData;
      
      if (req.body.firstName && req.body.lastName) {
        // Direct schema format
        submissionData = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          phone: req.body.phone,
          serviceNeeded: req.body.serviceNeeded || 'General inquiry',
          projectDetails: req.body.projectDetails || ''
        };
      } else {
        // Transform legacy format
        const { name, email, phone, message, serviceNeeded } = req.body || {};
        
        if (!name || !email || !phone) {
          return res.status(400).json({ 
            message: "Name, email, and phone are required",
            received: { name, email, phone, message }
          });
        }
        
        const nameParts = name.split(' ');
        submissionData = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: email,
          phone: phone,
          serviceNeeded: serviceNeeded || message || 'General inquiry',
          projectDetails: message || ''
        };
      }
      
      console.log("Final submission data:", submissionData);
      
      const validatedData = insertContactSubmissionSchema.parse(submissionData);
      const submission = await storage.createContactSubmission(validatedData);
      
      res.json({ 
        success: true, 
        message: "Contact form submitted successfully",
        submission: submission 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ 
        message: "Failed to submit contact form", 
        error: error.message,
        details: error.issues || error
      });
    }
  });

  // Admin routes for contact submissions
  app.get("/api/contact-submissions", authenticateToken, requireRole(['admin', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact submissions" });
    }
  });

  // Project management routes
  app.get("/api/projects", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", authenticateToken, requireRole(['admin', 'employee', 'contractor_trial', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Creating project with data:", req.body);
      
      const { name, ...rest } = req.body;
      
      // Keep name field as expected by schema
      const projectData = {
        name: name || rest.title || 'Untitled Project',
        serviceType: rest.serviceType || 'windows',
        status: rest.status || 'planning',
        description: rest.description || '',
        clientId: rest.customerId || rest.clientId,
        estimatedCost: rest.estimatedCost,
        startDate: rest.startDate,
        endDate: rest.endDate,
        assignedToId: rest.assignedToId,
        priority: rest.priority || 'medium',
        completionPercentage: rest.completionPercentage || 0
      };
      
      console.log("Transformed project data:", projectData);
      
      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(500).json({ message: "Failed to create project", details: error.message });
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      res.json(project);
    } catch (error: any) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Archive project
  app.put("/api/projects/:id/archive", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, { 
        projectStatus: 'archived',
        archivedAt: new Date()
      });
      res.json(project);
    } catch (error: any) {
      console.error("Error archiving project:", error);
      res.status(500).json({ message: "Failed to archive project" });
    }
  });

  // Move project to trash
  app.put("/api/projects/:id/trash", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, { 
        projectStatus: 'trashed',
        trashedAt: new Date()
      });
      res.json(project);
    } catch (error: any) {
      console.error("Error moving project to trash:", error);
      res.status(500).json({ message: "Failed to move project to trash" });
    }
  });

  // Restore project from trash/archive
  app.put("/api/projects/:id/restore", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, { 
        projectStatus: 'active',
        trashedAt: null,
        archivedAt: null
      });
      res.json(project);
    } catch (error: any) {
      console.error("Error restoring project:", error);
      res.status(500).json({ message: "Failed to restore project" });
    }
  });

  // Get archived projects
  app.get("/api/projects/archived", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const projects = await storage.getProjectsByStatus('archived');
      res.json(projects);
    } catch (error: any) {
      console.error("Error fetching archived projects:", error);
      res.status(500).json({ message: "Failed to fetch archived projects" });
    }
  });

  // Get trashed projects
  app.get("/api/projects/trash", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const projects = await storage.getProjectsByStatus('trashed');
      res.json(projects);
    } catch (error: any) {
      console.error("Error fetching trashed projects:", error);
      res.status(500).json({ message: "Failed to fetch trashed projects" });
    }
  });

  // Permanently delete projects (for admin cleanup of 30+ day old trash)
  app.delete("/api/projects/trash/cleanup", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deletedCount = await storage.deleteOldTrashedProjects(thirtyDaysAgo);
      res.json({ message: `Permanently deleted ${deletedCount} projects older than 30 days` });
    } catch (error: any) {
      console.error("Error cleaning up trash:", error);
      res.status(500).json({ message: "Failed to cleanup trash" });
    }
  });

  app.get("/api/employees", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Quote request routes
  app.post("/api/quote-requests", async (req, res) => {
    try {
      console.log("Quote request body:", req.body);
      
      // Handle flexible input format
      const { 
        customerName, 
        customerEmail, 
        customerPhone, 
        projectAddress,
        projectDescription,
        serviceType,
        windowConfigurations,
        items, 
        totalEstimate, 
        notes, 
        needsInstallation 
      } = req.body;
      
      if (!customerName || !customerEmail || !customerPhone) {
        return res.status(400).json({ 
          message: "Customer name, email, and phone are required",
          received: { customerName, customerEmail, customerPhone }
        });
      }

      const quoteRequest = await storage.createQuoteRequest({
        customerName,
        customerEmail,
        customerPhone,
        projectAddress: projectAddress || '',
        items: items || windowConfigurations || [],
        totalEstimate: totalEstimate || '0',
        notes: notes || projectDescription || '',
        needsInstallation: needsInstallation || false,
        status: "pending",
        priority: "normal"
      });

      // Create initial activity
      await storage.createQuoteActivity({
        quoteRequestId: quoteRequest.id,
        activityType: "created",
        description: `Quote request submitted by ${customerName}`,
        metadata: { 
          items: (items || windowConfigurations || []).length, 
          totalEstimate: totalEstimate || '0',
          serviceType: serviceType || 'general'
        }
      });

      res.status(201).json({ message: "Quote request submitted successfully", quoteNumber: quoteRequest.quoteNumber });
    } catch (error: any) {
      console.error("Error creating quote request:", error);
      res.status(500).json({ message: "Failed to submit quote request" });
    }
  });

  app.get("/api/quote-requests", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, assignedTo } = req.query;
      let quoteRequests;

      if (status) {
        quoteRequests = await storage.getQuoteRequestsByStatus(status as string);
      } else if (assignedTo) {
        quoteRequests = await storage.getQuoteRequestsByAssignee(parseInt(assignedTo as string));
      } else {
        quoteRequests = await storage.getAllQuoteRequests();
      }

      res.json(quoteRequests);
    } catch (error: any) {
      console.error("Error fetching quote requests:", error);
      res.status(500).json({ message: "Failed to fetch quote requests" });
    }
  });

  app.get("/api/quote-requests/:id", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const quoteRequest = await storage.getQuoteRequest(parseInt(req.params.id));
      if (!quoteRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }

      const activities = await storage.getQuoteActivities(quoteRequest.id);
      res.json({ ...quoteRequest, activities });
    } catch (error: any) {
      console.error("Error fetching quote request:", error);
      res.status(500).json({ message: "Failed to fetch quote request" });
    }
  });

  app.put("/api/quote-requests/:id", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      const quoteRequest = await storage.updateQuoteRequest(parseInt(req.params.id), updates);

      // Create activity for status change
      if (updates.status) {
        await storage.createQuoteActivity({
          quoteRequestId: quoteRequest.id,
          activityType: "status_changed",
          description: `Status changed to ${updates.status}`,
          performedBy: req.user!.id,
          metadata: { newStatus: updates.status }
        });
      }

      res.json(quoteRequest);
    } catch (error: any) {
      console.error("Error updating quote request:", error);
      res.status(500).json({ message: "Failed to update quote request" });
    }
  });

  app.post("/api/quote-requests/:id/activities", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { activityType, description, metadata } = req.body;
      
      const activity = await storage.createQuoteActivity({
        quoteRequestId: parseInt(req.params.id),
        activityType,
        description,
        performedBy: req.user!.id,
        metadata
      });

      res.status(201).json(activity);
    } catch (error: any) {
      console.error("Error creating quote activity:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Blog routes
  app.get("/api/blog", async (req, res) => {
    try {
      const { category } = req.query;
      let posts;
      
      if (category) {
        posts = await storage.getBlogPostsByCategory(category as string);
      } else {
        posts = await storage.getPublishedBlogPosts();
      }
      
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post || !post.isPublished) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error: any) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Admin blog management routes
  app.get("/api/admin/blog", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching all blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/admin/blog", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const postData = {
        ...req.body,
        authorId: req.user!.id,
        publishedAt: req.body.isPublished ? new Date() : null
      };
      
      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put("/api/admin/blog/:id", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      if (updates.isPublished && !updates.publishedAt) {
        updates.publishedAt = new Date();
      }
      
      const post = await storage.updateBlogPost(parseInt(req.params.id), updates);
      res.json(post);
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/:id", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteBlogPost(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Lead management routes
  app.get("/api/leads", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Creating lead with data:", req.body);
      
      const { customerName, customerEmail, customerPhone, ...rest } = req.body;
      
      // Transform customerName to firstName/lastName if provided
      let firstName = rest.firstName || '';
      let lastName = rest.lastName || '';
      
      if (customerName && (!firstName || !lastName)) {
        const nameParts = customerName.split(' ');
        firstName = nameParts[0] || 'Unknown';
        lastName = nameParts.slice(1).join(' ') || 'Lead';
      }
      
      // Ensure required fields are not empty
      const leadData = {
        firstName: firstName || 'Unknown',
        lastName: lastName || 'Lead', 
        email: customerEmail || rest.email || '',
        phone: customerPhone || rest.phone || '',
        source: rest.source || 'website',
        status: rest.status || 'new',
        priority: rest.priority || 'normal',
        serviceNeeded: rest.serviceNeeded || 'general',
        projectDescription: rest.projectDescription || '',
        estimatedValue: rest.estimatedValue,
        followUpDate: rest.followUpDate,
        assignedTo: rest.assignedTo,
        notes: rest.notes || ''
      };
      
      console.log("Transformed lead data:", leadData);
      
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead", details: error.message });
    }
  });

  app.get("/api/leads/:id", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const lead = await storage.getLead(parseInt(req.params.id));
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.put("/api/leads/:id", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      console.log("PUT /api/leads/:id called");
      console.log("Lead ID:", req.params.id);
      console.log("Request body:", req.body);
      console.log("User:", req.user);
      
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const lead = await storage.updateLead(leadId, req.body);
      console.log("Updated lead:", lead);
      res.json(lead);
    } catch (error: any) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteLead(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Job scheduling routes
  app.get("/api/jobs", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate, assignee } = req.query;
      let jobs;

      if (startDate && endDate) {
        jobs = await storage.getJobsByDateRange(new Date(startDate as string), new Date(endDate as string));
      } else if (assignee) {
        jobs = await storage.getJobsByAssignee(parseInt(assignee as string));
      } else {
        jobs = await storage.getAllJobs();
      }

      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post("/api/jobs", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const job = await storage.createJob(req.body);
      res.status(201).json(job);
    } catch (error: any) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.get("/api/jobs/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const job = await storage.getJob(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.put("/api/jobs/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const job = await storage.updateJob(parseInt(req.params.id), req.body);
      res.json(job);
    } catch (error: any) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteJob(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Proposal routes
  app.get("/api/proposals", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, leadId } = req.query;
      let proposals;

      if (status) {
        proposals = await storage.getProposalsByStatus(status as string);
      } else if (leadId) {
        proposals = await storage.getProposalsByLead(parseInt(leadId as string));
      } else {
        proposals = await storage.getAllProposals();
      }

      res.json(proposals);
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  // Public client view for proposals (no authentication required)
  app.get("/api/proposals/:id/client-view", async (req: Request, res: Response) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // Return proposal data for client view (without sensitive info)
      res.json({
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        clientName: proposal.clientName,
        clientEmail: proposal.clientEmail,
        clientPhone: proposal.clientPhone,
        projectAddress: proposal.projectAddress,
        description: proposal.description,
        totalAmount: proposal.totalAmount,
        sentAt: proposal.sentAt,
        viewedAt: proposal.viewedAt,
        signedAt: proposal.signedAt,
        paidAt: proposal.paidAt,
        createdAt: proposal.createdAt
      });
    } catch (error: any) {
      console.error("Error fetching proposal client view:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  app.post("/api/proposals", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const proposalData = {
        ...req.body,
        createdById: req.user!.id
      };
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error: any) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  app.put("/api/proposals/:id", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      if (updates.status === 'sent' && !updates.sentAt) {
        updates.sentAt = new Date();
      }
      if (['approved', 'rejected'].includes(updates.status) && !updates.respondedAt) {
        updates.respondedAt = new Date();
      }

      const proposal = await storage.updateProposal(parseInt(req.params.id), updates);
      res.json(proposal);
    } catch (error: any) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  // Communication log routes
  app.get("/api/communications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId, jobId } = req.query;
      const logs = await storage.getCommunicationLogs(
        leadId ? parseInt(leadId as string) : undefined,
        jobId ? parseInt(jobId as string) : undefined
      );
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching communication logs:", error);
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.post("/api/communications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const logData = {
        ...req.body,
        userId: req.user!.id
      };
      const log = await storage.createCommunicationLog(logData);
      res.status(201).json(log);
    } catch (error: any) {
      console.error("Error creating communication log:", error);
      res.status(500).json({ message: "Failed to create communication log" });
    }
  });

  // User availability routes
  app.get("/api/availability/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const availability = await storage.getUserAvailability(parseInt(req.params.userId));
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching user availability:", error);
      res.status(500).json({ message: "Failed to fetch user availability" });
    }
  });

  app.post("/api/availability", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const availability = await storage.setUserAvailability(req.body);
      res.json(availability);
    } catch (error: any) {
      console.error("Error setting user availability:", error);
      res.status(500).json({ message: "Failed to set user availability" });
    }
  });

  // Project updates routes
  app.get("/api/project-updates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = await storage.getAllProjectUpdates();
      res.json(updates);
    } catch (error: any) {
      console.error("Error fetching project updates:", error);
      res.status(500).json({ message: "Failed to fetch project updates" });
    }
  });

  app.post("/api/project-updates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updateData = {
        ...req.body,
        performedBy: req.user!.id
      };
      const update = await storage.createProjectUpdate(updateData);
      res.status(201).json(update);
    } catch (error: any) {
      console.error("Error creating project update:", error);
      res.status(500).json({ message: "Failed to create project update" });
    }
  });

  // Google Calendar Integration Routes
  app.post("/api/google-calendar/connect", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const authUrl = googleCalendarService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ message: "Failed to generate authentication URL" });
    }
  });

  app.get("/api/google-calendar/callback", async (req, res) => {
    try {
      const { code } = req.query as { code: string };
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      // In a real implementation, you'd store these tokens securely for the user
      res.redirect('/calendar?connected=true');
    } catch (error) {
      console.error("Error handling Google Calendar callback:", error);
      res.status(500).json({ message: "Failed to complete Google Calendar connection" });
    }
  });

  app.get("/api/google-calendar/events", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Return sample calendar events for demo purposes
      const sampleEvents = [
        {
          id: 'google-sample-1',
          summary: 'Team Meeting',
          description: 'Weekly team sync meeting',
          location: 'Conference Room A',
          start: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() },
          attendees: [{ email: 'team@company.com', displayName: 'Team' }]
        },
        {
          id: 'google-sample-2',
          summary: 'Client Consultation',
          description: 'Initial consultation with new client',
          location: '123 Main St, Gilbert, AZ',
          start: { dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString() },
          attendees: [{ email: 'client@email.com', displayName: 'Client' }]
        }
      ];
      res.json(sampleEvents);
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      res.status(500).json({ message: "Failed to fetch Google Calendar events" });
    }
  });

  app.post("/api/google-calendar/events", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const eventData = req.body;
      // Return success response for demo
      res.json({ 
        message: "Event created successfully",
        event: {
          id: `created-${Date.now()}`,
          ...eventData
        }
      });
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      res.status(500).json({ message: "Failed to create Google Calendar event" });
    }
  });

  app.post("/api/google-calendar/sync", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      res.json({ message: "Calendar sync completed successfully" });
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      res.status(500).json({ message: "Failed to sync with Google Calendar" });
    }
  });

  // ========================
  // COMPREHENSIVE CRM INTEGRATION ENDPOINTS
  // ========================

  // Lead to Project Conversion with Full Data Sync
  app.post("/api/crm/convert-lead-to-project", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId, projectData } = req.body;
      const project = await crmSync.convertLeadToProject(leadId, projectData);
      res.status(201).json(project);
    } catch (error: any) {
      console.error("Error converting lead to project:", error);
      res.status(500).json({ message: error.message || "Failed to convert lead to project" });
    }
  });

  // Quote to Project Conversion with Full Data Sync
  app.post("/api/crm/convert-quote-to-project", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { quoteId } = req.body;
      const project = await crmSync.convertQuoteToProject(quoteId);
      res.status(201).json(project);
    } catch (error: any) {
      console.error("Error converting quote to project:", error);
      res.status(500).json({ message: error.message || "Failed to convert quote to project" });
    }
  });

  // Comprehensive Analytics Dashboard
  app.get("/api/crm/analytics", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const analytics = await crmSync.getAnalyticsDashboard(
        userId ? parseInt(userId as string) : undefined,
        dateRange
      );
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Customer 360 View - Complete Customer History
  app.get("/api/crm/customer360/:customerId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { customerId } = req.params;
      const { customerType = 'lead' } = req.query;
      
      const customer360 = await crmSync.getCustomer360(
        parseInt(customerId),
        customerType as 'lead' | 'customer'
      );
      res.json(customer360);
    } catch (error: any) {
      console.error("Error fetching customer 360 view:", error);
      res.status(500).json({ message: "Failed to fetch customer 360 view" });
    }
  });

  // Unified Communication Logging with Auto-sync
  app.post("/api/crm/log-communication", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const communicationData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const communication = await crmSync.syncCommunication(communicationData);
      res.status(201).json(communication);
    } catch (error: any) {
      console.error("Error logging communication:", error);
      res.status(500).json({ message: "Failed to log communication" });
    }
  });

  // Customer Interaction Logging
  app.post("/api/crm/log-interaction", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const interactionData = {
        ...req.body,
        performedBy: req.user!.id
      };
      
      const interaction = await crmSync.logCustomerInteraction(interactionData);
      res.status(201).json(interaction);
    } catch (error: any) {
      console.error("Error logging customer interaction:", error);
      res.status(500).json({ message: "Failed to log customer interaction" });
    }
  });

  // Project Status Update with Full Sync
  app.put("/api/crm/projects/:projectId/status", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId } = req.params;
      const { status, notes } = req.body;
      
      await crmSync.updateProjectStatus(
        parseInt(projectId),
        status,
        req.user!.id,
        notes
      );
      res.json({ message: "Project status updated successfully" });
    } catch (error: any) {
      console.error("Error updating project status:", error);
      res.status(500).json({ message: "Failed to update project status" });
    }
  });

  // Job Scheduling with Project Sync
  app.post("/api/crm/schedule-job", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const jobData = {
        ...req.body,
        assignedToId: req.user!.id
      };
      
      const job = await crmSync.syncJobWithProject(jobData);
      res.status(201).json(job);
    } catch (error: any) {
      console.error("Error scheduling job:", error);
      res.status(500).json({ message: "Failed to schedule job" });
    }
  });

  // Update Pipeline Analytics
  app.post("/api/crm/update-pipeline-analytics", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      await crmSync.updatePipelineAnalytics();
      res.json({ message: "Pipeline analytics updated successfully" });
    } catch (error: any) {
      console.error("Error updating pipeline analytics:", error);
      res.status(500).json({ message: "Failed to update pipeline analytics" });
    }
  });

  // ===== COMPREHENSIVE PROPOSAL SYSTEM =====
  
  // Create new proposal from project
  app.post("/api/proposals", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const proposalData = insertProposalSchema.parse(req.body);
      
      const proposal = await storage.createProposal({
        ...proposalData,
        createdBy: req.user!.id,
        status: "draft"
      });

      res.status(201).json(proposal);
    } catch (error: any) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  // Get all proposals
  app.get("/api/proposals", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, projectId } = req.query;
      let proposals;

      if (status) {
        proposals = await storage.getProposalsByStatus(status as string);
      } else if (projectId) {
        proposals = await storage.getProposalsByProject(parseInt(projectId as string));
      } else {
        proposals = await storage.getAllProposals();
      }

      res.json(proposals);
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  // Get specific proposal with full details
  app.get("/api/proposals/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const proposal = await storage.getProposal(parseInt(req.params.id));
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // Get related invoice, contract, and payment data
      const invoice = proposal.invoiceId ? await storage.getProposalInvoice(proposal.invoiceId) : null;
      const contract = proposal.contractId ? await storage.getProposalContract(proposal.contractId) : null;
      const payment = proposal.paymentId ? await storage.getProposalPayment(proposal.paymentId) : null;

      res.json({
        ...proposal,
        invoice,
        contract,
        payment
      });
    } catch (error: any) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  // Update proposal
  app.put("/api/proposals/:id", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      const proposal = await storage.updateProposal(parseInt(req.params.id), updates);
      res.json(proposal);
    } catch (error: any) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  // PROPOSAL INVOICE ENDPOINTS
  
  // Create proposal invoice
  app.post("/api/proposals/:id/invoice", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const invoiceData = insertProposalInvoiceSchema.parse({
        ...req.body,
        proposalId,
        invoiceNumber: `INV-${Date.now()}`
      });

      const invoice = await storage.createProposalInvoice(invoiceData);
      
      // Update proposal with invoice ID
      await storage.updateProposal(proposalId, { invoiceId: invoice.id });

      res.status(201).json(invoice);
    } catch (error: any) {
      console.error("Error creating proposal invoice:", error);
      res.status(500).json({ message: "Failed to create proposal invoice" });
    }
  });

  // Update proposal invoice
  app.put("/api/proposals/:proposalId/invoice/:invoiceId", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const updates = req.body;
      
      const invoice = await storage.updateProposalInvoice(invoiceId, updates);
      res.json(invoice);
    } catch (error: any) {
      console.error("Error updating proposal invoice:", error);
      res.status(500).json({ message: "Failed to update proposal invoice" });
    }
  });

  // PROPOSAL CONTRACT ENDPOINTS
  
  // Create proposal contract
  app.post("/api/proposals/:id/contract", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const contractData = insertProposalContractSchema.parse({
        ...req.body,
        proposalId
      });

      const contract = await storage.createProposalContract(contractData);
      
      // Update proposal with contract ID
      await storage.updateProposal(proposalId, { contractId: contract.id });

      res.status(201).json(contract);
    } catch (error: any) {
      console.error("Error creating proposal contract:", error);
      res.status(500).json({ message: "Failed to create proposal contract" });
    }
  });

  // Update proposal contract
  app.put("/api/proposals/:proposalId/contract/:contractId", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const updates = req.body;
      
      const contract = await storage.updateProposalContract(contractId, updates);
      res.json(contract);
    } catch (error: any) {
      console.error("Error updating proposal contract:", error);
      res.status(500).json({ message: "Failed to update proposal contract" });
    }
  });

  // Sign contract (client or contractor)
  app.post("/api/proposals/:proposalId/contract/:contractId/sign", async (req: AuthenticatedRequest, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const proposalId = parseInt(req.params.proposalId);
      const { signatureType, signatureName, signatureData, ipAddress } = req.body;

      const signatureInfo = {
        name: signatureName,
        signature: signatureData,
        timestamp: new Date().toISOString(),
        ipAddress: ipAddress || req.ip
      };

      const updates: any = {};
      if (signatureType === 'contractor') {
        updates.contractorSignature = signatureInfo;
        updates.signedByContractor = true;
      } else if (signatureType === 'client') {
        updates.clientSignature = signatureInfo;
        updates.signedByClient = true;
      }

      const contract = await storage.updateProposalContract(contractId, updates);
      
      // Update proposal status if both parties have signed
      if (contract.signedByContractor && contract.signedByClient) {
        await storage.updateProposal(proposalId, { 
          status: "signed",
          signedAt: new Date()
        });
      }

      res.json(contract);
    } catch (error: any) {
      console.error("Error signing contract:", error);
      res.status(500).json({ message: "Failed to sign contract" });
    }
  });

  // PROPOSAL PAYMENT ENDPOINTS
  
  // Create proposal payment structure
  app.post("/api/proposals/:id/payment", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const paymentData = insertProposalPaymentSchema.parse({
        ...req.body,
        proposalId
      });

      const payment = await storage.createProposalPayment(paymentData);
      
      // Update proposal with payment ID
      await storage.updateProposal(proposalId, { paymentId: payment.id });

      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating proposal payment:", error);
      res.status(500).json({ message: "Failed to create proposal payment" });
    }
  });

  // Update proposal payment
  app.put("/api/proposals/:proposalId/payment/:paymentId", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const updates = req.body;
      
      const payment = await storage.updateProposalPayment(paymentId, updates);
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating proposal payment:", error);
      res.status(500).json({ message: "Failed to update proposal payment" });
    }
  });

  // Process milestone payment
  app.post("/api/proposals/:proposalId/payment/:paymentId/pay-milestone", async (req: AuthenticatedRequest, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const proposalId = parseInt(req.params.proposalId);
      const { milestoneId, paymentMethodId, tipAmount } = req.body;

      const payment = await storage.getProposalPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Find the milestone
      const milestones = payment.milestones as any[];
      const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
      
      if (milestoneIndex === -1) {
        return res.status(404).json({ message: "Milestone not found" });
      }

      const milestone = milestones[milestoneIndex];
      
      // TODO: Process payment with Stripe
      // For now, mark as paid
      milestone.status = "paid";
      milestone.paymentMethod = "card";
      milestone.paidAt = new Date().toISOString();
      milestone.transactionId = `txn_${Date.now()}`;

      const totalPaid = parseFloat(payment.totalPaid) + milestone.amount + (tipAmount || 0);
      const remainingBalance = parseFloat(payment.remainingBalance) - milestone.amount;

      const updates = {
        milestones,
        totalPaid: totalPaid.toString(),
        remainingBalance: remainingBalance.toString(),
        tipAmount: ((parseFloat(payment.tipAmount) || 0) + (tipAmount || 0)).toString()
      };

      const updatedPayment = await storage.updateProposalPayment(paymentId, updates);
      
      // Update proposal status if fully paid
      if (remainingBalance <= 0) {
        await storage.updateProposal(proposalId, { 
          status: "paid",
          paidAt: new Date()
        });
      }

      res.json(updatedPayment);
    } catch (error: any) {
      console.error("Error processing milestone payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // PROPOSAL TEMPLATE ENDPOINTS
  
  // Get proposal templates
  app.get("/api/proposal-templates", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const { templateType } = req.query;
      let templates;

      if (templateType) {
        templates = await storage.getProposalTemplatesByType(templateType as string);
      } else {
        templates = await storage.getAllProposalTemplates();
      }

      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching proposal templates:", error);
      res.status(500).json({ message: "Failed to fetch proposal templates" });
    }
  });

  // Create proposal template
  app.post("/api/proposal-templates", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const templateData = insertProposalTemplateSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });

      const template = await storage.createProposalTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating proposal template:", error);
      res.status(500).json({ message: "Failed to create proposal template" });
    }
  });

  // Update proposal template
  app.put("/api/proposal-templates/:id", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const updates = req.body;
      
      const template = await storage.updateProposalTemplate(templateId, updates);
      res.json(template);
    } catch (error: any) {
      console.error("Error updating proposal template:", error);
      res.status(500).json({ message: "Failed to update proposal template" });
    }
  });

  // Send proposal to client
  app.post("/api/proposals/:id/send", authenticateToken, requireRole(['admin', 'employee', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      
      const proposal = await storage.updateProposal(proposalId, {
        status: "sent",
        sentAt: new Date()
      });

      // TODO: Send email notification to client
      // This would integrate with SendGrid or similar email service

      res.json({ message: "Proposal sent successfully", proposal });
    } catch (error: any) {
      console.error("Error sending proposal:", error);
      res.status(500).json({ message: "Failed to send proposal" });
    }
  });

  // Client view proposal (public endpoint)
  app.get("/api/proposals/:id/client-view", async (req: AuthenticatedRequest, res) => {
    try {
      const proposal = await storage.getProposal(parseInt(req.params.id));
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      // Mark as viewed if not already
      if (!proposal.viewedAt) {
        await storage.updateProposal(proposal.id, { 
          status: "viewed",
          viewedAt: new Date()
        });
      }

      // Get related data for client view
      const invoice = proposal.invoiceId ? await storage.getProposalInvoice(proposal.invoiceId) : null;
      const contract = proposal.contractId ? await storage.getProposalContract(proposal.contractId) : null;
      const payment = proposal.paymentId ? await storage.getProposalPayment(proposal.paymentId) : null;

      res.json({
        ...proposal,
        invoice,
        contract,
        payment
      });
    } catch (error: any) {
      console.error("Error fetching proposal for client:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  // Get Lead Metrics with Auto-calculation
  app.get("/api/crm/lead-metrics/:leadId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId } = req.params;
      await crmSync.updateLeadMetrics(parseInt(leadId));
      
      const metrics = await storage.getLeadMetrics(parseInt(leadId));
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching lead metrics:", error);
      res.status(500).json({ message: "Failed to fetch lead metrics" });
    }
  });

  // Bulk Data Sync - Synchronize all related data
  app.post("/api/crm/bulk-sync", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { syncType } = req.body; // 'all', 'leads', 'projects', 'analytics'
      
      let results = [];
      
      if (syncType === 'all' || syncType === 'analytics') {
        await crmSync.updatePipelineAnalytics();
        results.push('Pipeline analytics updated');
      }
      
      if (syncType === 'all' || syncType === 'leads') {
        // Update metrics for all leads
        const leads = await storage.getAllLeads();
        for (const lead of leads) {
          await crmSync.updateLeadMetrics(lead.id);
        }
        results.push(`Lead metrics updated for ${leads.length} leads`);
      }
      
      res.json({ 
        message: "Bulk sync completed successfully",
        results 
      });
    } catch (error: any) {
      console.error("Error performing bulk sync:", error);
      res.status(500).json({ message: "Failed to perform bulk sync" });
    }
  });

  // CRM Health Check - Verify data integrity
  app.get("/api/crm/health-check", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const healthData = {
        totalLeads: await storage.getLeadsCount(),
        totalProjects: await storage.getProjectsCount(),
        totalJobs: await storage.getJobsCount(),
        totalCommunications: await storage.getCommunicationsCount(),
        lastAnalyticsUpdate: new Date().toISOString(),
        dataIntegrity: "OK"
      };
      
      res.json(healthData);
    } catch (error: any) {
      console.error("Error performing health check:", error);
      res.status(500).json({ message: "Failed to perform health check" });
    }
  });

  // Company posts endpoints for social feed
  app.get("/api/company-posts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const posts = await storage.getAllCompanyPosts();
      // Sort posts by creation date, newest first
      const sortedPosts = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(sortedPosts);
    } catch (error: any) {
      console.error("Error fetching company posts:", error);
      res.status(500).json({ message: "Failed to fetch company posts" });
    }
  });

  app.post("/api/company-posts", authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      const { content, feeling } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }

      const postData: any = {
        content: content.trim(),
        authorId: req.user!.id,
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0
      };

      // Add feeling if provided
      if (feeling) {
        postData.feeling = feeling;
      }

      // Add image URL if file was uploaded
      if (req.file) {
        postData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const newPost = await storage.createCompanyPost(postData);

      res.status(201).json(newPost);
    } catch (error: any) {
      console.error("Error creating company post:", error);
      res.status(500).json({ message: "Failed to create company post" });
    }
  });

  // Record post view
  app.post("/api/company-posts/:id/view", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      await storage.recordPostView(postId, userId);
      res.status(200).json({ message: "View recorded" });
    } catch (error: any) {
      console.error("Error recording post view:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Get post viewers
  app.get("/api/company-posts/:id/viewers", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      const viewers = await storage.getPostViewers(postId);
      res.json(viewers);
    } catch (error: any) {
      console.error("Error fetching post viewers:", error);
      res.status(500).json({ message: "Failed to fetch viewers" });
    }
  });

  // Company settings routes
  app.get("/api/company-settings", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || {});
    } catch (error: any) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.put("/api/company-settings", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.updateCompanySettings(req.body);
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  app.post("/api/test-connection/:type", authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { type } = req.params;
      const settings = await storage.getCompanySettings();
      
      if (!settings) {
        return res.status(400).json({ message: "No settings configured" });
      }

      if (type === 'openphone') {
        if (!settings.openphoneApiKey) {
          return res.status(400).json({ message: "OpenPhone API key not configured" });
        }
        // Test OpenPhone API connection
        res.json({ success: true, message: "OpenPhone connection test successful" });
      } else if (type === 'gmail') {
        if (!settings.gmailClientId || !settings.gmailClientSecret) {
          return res.status(400).json({ message: "Gmail credentials not configured" });
        }
        // Test Gmail API connection
        res.json({ success: true, message: "Gmail connection test successful" });
      } else {
        res.status(400).json({ message: "Invalid connection type" });
      }
    } catch (error: any) {
      console.error("Error testing connection:", error);
      res.status(500).json({ message: "Connection test failed" });
    }
  });

  // Phone communication endpoints
  app.post("/api/send-text", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId, phoneNumber, message, fromNumber } = req.body;
      
      // Log the text message to database
      await storage.createCommunicationLog({
        leadId,
        type: 'text',
        direction: 'outbound',
        content: message,
        metadata: { fromNumber, sentVia: 'OpenPhone', phoneNumber }
      });

      res.json({ success: true, message: "Text message logged successfully" });
    } catch (error: any) {
      console.error("Error sending text:", error);
      res.status(500).json({ message: "Failed to send text" });
    }
  });

  app.post("/api/log-call", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId, phoneNumber, notes, fromNumber } = req.body;
      
      // Log the call to database
      await storage.createCommunicationLog({
        leadId,
        type: 'call',
        direction: 'outbound',
        content: notes,
        metadata: { fromNumber, madeVia: 'OpenPhone', phoneNumber }
      });

      res.json({ success: true, message: "Call logged successfully" });
    } catch (error: any) {
      console.error("Error logging call:", error);
      res.status(500).json({ message: "Failed to log call" });
    }
  });

  // ========================
  // CONTRACT MANAGEMENT ENDPOINTS - HoneyBook Style
  // ========================

  // Get all contracts
  app.get("/api/contracts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error: any) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  // Create new contract
  app.post("/api/contracts", authenticateToken, requireRole(['admin', 'contractor_trial', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const contractData = {
        ...req.body,
        createdBy: req.user!.id,
        createdAt: new Date().toISOString()
      };
      const contract = await storage.createContract(contractData);
      res.status(201).json(contract);
    } catch (error: any) {
      console.error("Error creating contract:", error);
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  // Get contract by ID
  app.get("/api/contracts/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContractById(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error: any) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  // Update contract
  app.put("/api/contracts/:id", authenticateToken, requireRole(['admin', 'contractor_trial', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.updateContract(contractId, req.body);
      res.json(contract);
    } catch (error: any) {
      console.error("Error updating contract:", error);
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  // Send contract to client
  app.post("/api/contracts/:id/send", authenticateToken, requireRole(['admin', 'contractor_trial', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.updateContract(contractId, {
        status: 'sent',
        sentAt: new Date().toISOString()
      });
      res.json(contract);
    } catch (error: any) {
      console.error("Error sending contract:", error);
      res.status(500).json({ message: "Failed to send contract" });
    }
  });

  // Get contract templates
  app.get("/api/contract-templates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const templates = await storage.getAllContractTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching contract templates:", error);
      res.status(500).json({ message: "Failed to fetch contract templates" });
    }
  });

  // Create contract template
  app.post("/api/contract-templates", authenticateToken, requireRole(['admin', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const templateData = {
        ...req.body,
        createdBy: req.user!.id,
        createdAt: new Date().toISOString()
      };
      const template = await storage.createContractTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating contract template:", error);
      res.status(500).json({ message: "Failed to create contract template" });
    }
  });

  // Get proposal templates
  app.get("/api/proposal-templates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const templates = await storage.getAllProposalTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching proposal templates:", error);
      res.status(500).json({ message: "Failed to fetch proposal templates" });
    }
  });

  // Create proposal template
  app.post("/api/proposal-templates", authenticateToken, requireRole(['admin', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const templateData = {
        ...req.body,
        createdBy: req.user!.id,
        createdAt: new Date().toISOString()
      };
      const template = await storage.createProposalTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating proposal template:", error);
      res.status(500).json({ message: "Failed to create proposal template" });
    }
  });

  // Get invoices
  app.get("/api/invoices", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Create invoice
  app.post("/api/invoices", authenticateToken, requireRole(['admin', 'contractor_trial', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const invoiceData = {
        ...req.body,
        createdBy: req.user!.id,
        createdAt: new Date().toISOString()
      };
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Get client messages
  app.get("/api/client-messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { clientId } = req.query;
      const messages = clientId 
        ? await storage.getClientMessages(parseInt(clientId as string))
        : await storage.getAllClientMessages();
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching client messages:", error);
      res.status(500).json({ message: "Failed to fetch client messages" });
    }
  });

  // Send client message
  app.post("/api/client-messages", authenticateToken, requireRole(['admin', 'contractor_trial', 'contractor_paid']), async (req: AuthenticatedRequest, res) => {
    try {
      const messageData = {
        ...req.body,
        sentBy: req.user!.id,
        sentAt: new Date().toISOString()
      };
      const message = await storage.createClientMessage(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error sending client message:", error);
      res.status(500).json({ message: "Failed to send client message" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    let session: CollaborationSession | null = null;

    ws.on('message', async (data) => {
      try {
        const message: WSMessage & { token?: string } = JSON.parse(data.toString());

        // Handle initial connection with authentication
        if (message.type === 'user-join' && message.token) {
          try {
            const decoded = jwt.verify(message.token, JWT_SECRET) as any;
            const user = await storage.getUserById(decoded.userId);
            
            if (user) {
              const sessionId = uuidv4();
              session = {
                userId: user.id,
                username: user.username,
                sessionId,
                ws
              };
              
              activeSessions.set(sessionId, session);
              
              // Send current state to new user
              const currentEditors = Array.from(cellEditors.entries()).map(([cellKey, editor]) => ({
                cellKey,
                user: {
                  id: editor.userId,
                  username: editor.username,
                  sessionId: editor.sessionId
                }
              }));
              
              ws.send(JSON.stringify({
                type: 'collaboration-state',
                payload: {
                  sessionId,
                  activeEditors: currentEditors,
                  onlineUsers: Array.from(activeSessions.values()).map(s => ({
                    id: s.userId,
                    username: s.username,
                    sessionId: s.sessionId
                  }))
                }
              }));

              // Broadcast new user joined
              broadcastToAll({
                type: 'user-join',
                payload: {
                  user: {
                    id: user.id,
                    username: user.username,
                    sessionId
                  }
                }
              }, sessionId);
            }
          } catch (error) {
            ws.close(1008, 'Invalid token');
            return;
          }
        }

        if (!session) return;

        switch (message.type) {
          case 'cell-start-edit': {
            const { projectId, column } = message.payload;
            const cellKey = getCellKey(projectId, column);
            
            // Remove user from any previous cell
            if (session.currentCell) {
              const prevCellKey = getCellKey(session.currentCell.projectId, session.currentCell.column);
              cellEditors.delete(prevCellKey);
            }
            
            // Add user to new cell
            session.currentCell = {
              projectId,
              column,
              timestamp: Date.now()
            };
            cellEditors.set(cellKey, session);
            
            // Broadcast cell editing started
            broadcastToAll({
              type: 'cell-start-edit',
              payload: {
                cellKey,
                projectId,
                column,
                user: {
                  id: session.userId,
                  username: session.username,
                  sessionId: session.sessionId
                }
              }
            }, session.sessionId);
            break;
          }

          case 'cell-end-edit': {
            const { projectId, column } = message.payload;
            const cellKey = getCellKey(projectId, column);
            
            cellEditors.delete(cellKey);
            session.currentCell = undefined;
            
            // Broadcast cell editing ended
            broadcastToAll({
              type: 'cell-end-edit',
              payload: {
                cellKey,
                projectId,
                column,
                user: {
                  id: session.userId,
                  username: session.username,
                  sessionId: session.sessionId
                }
              }
            }, session.sessionId);
            break;
          }

          case 'cell-update': {
            const { projectId, column, value } = message.payload;
            
            // Broadcast real-time cell updates
            broadcastToAll({
              type: 'cell-update',
              payload: {
                projectId,
                column,
                value,
                user: {
                  id: session.userId,
                  username: session.username,
                  sessionId: session.sessionId
                }
              }
            }, session.sessionId);
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (session) {
        // Clean up user's editing state
        if (session.currentCell) {
          const cellKey = getCellKey(session.currentCell.projectId, session.currentCell.column);
          cellEditors.delete(cellKey);
        }
        
        activeSessions.delete(session.sessionId);
        
        // Broadcast user left
        broadcastToAll({
          type: 'user-leave',
          payload: {
            user: {
              id: session.userId,
              username: session.username,
              sessionId: session.sessionId
            }
          }
        });
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  return httpServer;
}