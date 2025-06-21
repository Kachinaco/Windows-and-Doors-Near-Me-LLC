import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { googleCalendarService } from "./google-calendar";
import {
  insertUserSchema,
  loginSchema,
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertContactSubmissionSchema,
  insertProjectSchema,
  insertProjectUpdateSchema,
} from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
      const submissionData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(submissionData);
      res.json(submission);
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({ message: "Failed to submit contact form" });
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
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
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
      const { customerName, customerEmail, customerPhone, projectAddress, items, totalEstimate, notes, needsInstallation } = req.body;
      
      if (!customerName || !customerEmail || !customerPhone || !items || !totalEstimate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const quoteRequest = await storage.createQuoteRequest({
        customerName,
        customerEmail,
        customerPhone,
        projectAddress,
        items,
        totalEstimate,
        notes,
        needsInstallation: needsInstallation || false,
        status: "pending",
        priority: "normal"
      });

      // Create initial activity
      await storage.createQuoteActivity({
        quoteRequestId: quoteRequest.id,
        activityType: "created",
        description: `Quote request submitted by ${customerName}`,
        metadata: { items: items.length, totalEstimate }
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
      const lead = await storage.createLead(req.body);
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
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
      const lead = await storage.updateLead(parseInt(req.params.id), req.body);
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

  // Company posts endpoints for social feed
  app.get("/api/company-posts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const posts = await storage.getAllCompanyPosts();
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching company posts:", error);
      res.status(500).json({ message: "Failed to fetch company posts" });
    }
  });

  app.post("/api/company-posts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }

      const newPost = await storage.createCompanyPost({
        content: content.trim(),
        authorId: req.user!.id,
        likesCount: 0,
        commentsCount: 0
      });

      res.status(201).json(newPost);
    } catch (error: any) {
      console.error("Error creating company post:", error);
      res.status(500).json({ message: "Failed to create company post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}