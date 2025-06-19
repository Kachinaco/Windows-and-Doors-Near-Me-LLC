import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertContactSubmissionSchema,
  insertProjectSchema,
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
        role: user.role,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
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

  const httpServer = createServer(app);
  return httpServer;
}