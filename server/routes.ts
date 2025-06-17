import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertProjectSchema, insertTaskSchema, insertProjectUpdateSchema, insertContactSubmissionSchema, insertClientSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "windows-doors-project-management-secret-2025";

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'windows-doors-session-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
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
        message: "User registered successfully",
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
      }
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
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid login data", errors: error.errors });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
      }
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
        role: user.role 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Project management routes
  app.get("/api/projects", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      let projects;
      if (req.user!.role === 'admin' || req.user!.role === 'employee') {
        projects = await storage.getAllProjects();
      } else {
        projects = await storage.getProjectsByCustomer(req.user!.id);
      }
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid project data", errors: error.errors });
      } else {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Failed to create project" });
      }
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check access permissions
      if (req.user!.role === 'customer' && project.customerId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;
      
      // Check if user can update this project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (req.user!.role === 'customer' && project.customerId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedProject = await storage.updateProject(projectId, updates);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Task management routes
  app.get("/api/projects/:projectId/tasks", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tasks = await storage.getTasksByProject(projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.put("/api/tasks/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedTask = await storage.updateTask(taskId, updates);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Project updates/communication
  app.get("/api/projects/:projectId/updates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const updates = await storage.getProjectUpdates(projectId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching project updates:", error);
      res.status(500).json({ message: "Failed to fetch project updates" });
    }
  });

  app.post("/api/project-updates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updateData = insertProjectUpdateSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const update = await storage.createProjectUpdate(updateData);
      res.json(update);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        console.error("Error creating project update:", error);
        res.status(500).json({ message: "Failed to create project update" });
      }
    }
  });

  // Employee routes
  app.get("/api/employees", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees.map(emp => ({ 
        id: emp.id, 
        username: emp.username, 
        firstName: emp.firstName, 
        lastName: emp.lastName,
        email: emp.email
      })));
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Client management endpoints
  app.get("/api/clients", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid client data", errors: error.errors });
      } else {
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Failed to create client" });
      }
    }
  });

  app.get("/api/clients/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.put("/api/clients/:id", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const updates = req.body;
      const client = await storage.updateClient(clientId, updates);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      
      console.log("New contact submission:", submission);
      
      res.json({ success: true, message: "Contact form submitted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid form data", 
          errors: error.errors 
        });
      } else {
        console.error("Contact form error:", error);
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  // Get all contact submissions (admin/employee only)
  app.get("/api/contact-submissions", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.put("/api/contact-submissions/:id/status", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const { status } = req.body;
      const updatedSubmission = await storage.updateContactSubmissionStatus(submissionId, status);
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating contact submission:", error);
      res.status(500).json({ message: "Failed to update contact submission status" });
    }
  });

  // Consultation scheduling routes
  app.get("/api/consultations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const consultations = await storage.getAllConsultations();
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  app.post("/api/consultations", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const consultation = await storage.createConsultation(req.body);
      res.json(consultation);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ message: "Failed to create consultation" });
    }
  });

  app.get("/api/consultations/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const consultation = await storage.getConsultation(parseInt(id));
      
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      
      res.json(consultation);
    } catch (error) {
      console.error("Error fetching consultation:", error);
      res.status(500).json({ message: "Failed to fetch consultation" });
    }
  });

  app.put("/api/consultations/:id", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const consultation = await storage.updateConsultation(parseInt(id), req.body);
      res.json(consultation);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(500).json({ message: "Failed to update consultation" });
    }
  });

  app.delete("/api/consultations/:id", authenticateToken, requireRole(['admin', 'employee']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteConsultation(parseInt(id));
      res.json({ message: "Consultation deleted successfully" });
    } catch (error) {
      console.error("Error deleting consultation:", error);
      res.status(500).json({ message: "Failed to delete consultation" });
    }
  });

  app.get("/api/consultations/employee/:employeeId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { employeeId } = req.params;
      const consultations = await storage.getConsultationsByEmployee(parseInt(employeeId));
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching employee consultations:", error);
      res.status(500).json({ message: "Failed to fetch employee consultations" });
    }
  });

  app.get("/api/consultations/client/:clientId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { clientId } = req.params;
      const consultations = await storage.getConsultationsByClient(parseInt(clientId));
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching client consultations:", error);
      res.status(500).json({ message: "Failed to fetch client consultations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
