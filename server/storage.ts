import {
  users,
  products,
  cartItems,
  orders,
  contactSubmissions,
  projects,
  quoteRequests,
  quoteActivities,
  blogPosts,
  leads,
  jobs,
  proposals,
  communicationLogs,
  userAvailability,
  projectUpdates,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type ContactSubmission,
  type InsertContactSubmission,
  type Project,
  type InsertProject,
  type QuoteRequest,
  type InsertQuoteRequest,
  type QuoteActivity,
  type InsertQuoteActivity,
  type BlogPost,
  type InsertBlogPost,
  type Lead,
  type InsertLead,
  type Job,
  type InsertJob,
  type Proposal,
  type InsertProposal,
  type CommunicationLog,
  type InsertCommunicationLog,
  type UserAvailability,
  type InsertUserAvailability,
  type ProjectUpdate,
  type InsertProjectUpdate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Interface for storage operations - simplified for e-commerce
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  
  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, updates: Partial<InsertCartItem>): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: number): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order>;
  
  // Contact form operations
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  updateContactSubmissionStatus(id: number, status: string): Promise<ContactSubmission>;
  
  // Project management operations
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  getAllEmployees(): Promise<User[]>;
  
  // Quote request operations
  createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest>;
  getQuoteRequest(id: number): Promise<QuoteRequest | undefined>;
  getAllQuoteRequests(): Promise<QuoteRequest[]>;
  getQuoteRequestsByStatus(status: string): Promise<QuoteRequest[]>;
  getQuoteRequestsByAssignee(assigneeId: number): Promise<QuoteRequest[]>;
  updateQuoteRequest(id: number, updates: Partial<InsertQuoteRequest>): Promise<QuoteRequest>;
  
  // Quote activity operations
  createQuoteActivity(activity: InsertQuoteActivity): Promise<QuoteActivity>;
  getQuoteActivities(quoteRequestId: number): Promise<QuoteActivity[]>;
  
  // Blog operations
  getAllBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  getBlogPostsByCategory(category: string): Promise<BlogPost[]>;
  
  // Project updates operations
  getAllProjectUpdates(): Promise<ProjectUpdate[]>;
  getProjectUpdates(projectId: number): Promise<ProjectUpdate[]>;
  createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const userData = { ...insertUser, password: hashedPassword };
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<any[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        customizations: cartItems.customizations,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if product already in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, insertCartItem.userId!),
        eq(cartItems.productId, insertCartItem.productId!)
      ));

    if (existingItem) {
      // Update quantity if item exists
      return await this.updateCartItem(existingItem.id, {
        quantity: existingItem.quantity + (insertCartItem.quantity || 1)
      });
    } else {
      // Create new cart item
      const [cartItem] = await db
        .insert(cartItems)
        .values(insertCartItem)
        .returning();
      return cartItem;
    }
  }

  async updateCartItem(id: number, updates: Partial<InsertCartItem>): Promise<CartItem> {
    const [cartItem] = await db
      .update(cartItems)
      .set(updates)
      .where(eq(cartItems.id, id))
      .returning();
    return cartItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // Contact form operations
  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await db
      .insert(contactSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  async updateContactSubmissionStatus(id: number, status: string): Promise<ContactSubmission> {
    const [submission] = await db
      .update(contactSubmissions)
      .set({ status })
      .where(eq(contactSubmissions.id, id))
      .returning();
    return submission;
  }

  // Project management operations
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async getAllEmployees(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'contractor_paid'))
      .orderBy(users.firstName);
  }

  // Quote request operations
  async createQuoteRequest(insertQuoteRequest: InsertQuoteRequest): Promise<QuoteRequest> {
    const quoteNumber = `QR-${Date.now()}`;
    const [quoteRequest] = await db
      .insert(quoteRequests)
      .values({
        ...insertQuoteRequest,
        quoteNumber,
      })
      .returning();
    return quoteRequest;
  }

  async getQuoteRequest(id: number): Promise<QuoteRequest | undefined> {
    const [quoteRequest] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
    return quoteRequest;
  }

  async getAllQuoteRequests(): Promise<QuoteRequest[]> {
    const requests = await db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
    return requests;
  }

  async getQuoteRequestsByStatus(status: string): Promise<QuoteRequest[]> {
    const requests = await db.select().from(quoteRequests)
      .where(eq(quoteRequests.status, status))
      .orderBy(desc(quoteRequests.createdAt));
    return requests;
  }

  async getQuoteRequestsByAssignee(assigneeId: number): Promise<QuoteRequest[]> {
    const requests = await db.select().from(quoteRequests)
      .where(eq(quoteRequests.assignedTo, assigneeId))
      .orderBy(desc(quoteRequests.createdAt));
    return requests;
  }

  async updateQuoteRequest(id: number, updates: Partial<InsertQuoteRequest>): Promise<QuoteRequest> {
    const [quoteRequest] = await db
      .update(quoteRequests)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, id))
      .returning();
    return quoteRequest;
  }

  // Quote activity operations
  async createQuoteActivity(insertActivity: InsertQuoteActivity): Promise<QuoteActivity> {
    const [activity] = await db
      .insert(quoteActivities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getQuoteActivities(quoteRequestId: number): Promise<QuoteActivity[]> {
    const activities = await db.select().from(quoteActivities)
      .where(eq(quoteActivities.quoteRequestId, quoteRequestId))
      .orderBy(desc(quoteActivities.createdAt));
    return activities;
  }

  // Blog operations
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values(insertBlogPost)
      .returning();
    return post;
  }

  async updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [post] = await db
      .update(blogPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(and(eq(blogPosts.category, category), eq(blogPosts.isPublished, true)))
      .orderBy(desc(blogPosts.publishedAt));
  }

  // Lead operations
  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadsByAssignee(assigneeId: number): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(eq(leads.assignedToId, assigneeId))
      .orderBy(desc(leads.createdAt));
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(eq(leads.status, status))
      .orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Job operations
  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobsByAssignee(assigneeId: number): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(eq(jobs.assignedToId, assigneeId))
      .orderBy(desc(jobs.shiftStartDate));
  }

  async getJobsByCustomer(customerId: number): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(eq(jobs.customerId, customerId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobsByDateRange(startDate: Date, endDate: Date): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(and(
        gte(jobs.shiftStartDate, startDate),
        lte(jobs.shiftStartDate, endDate)
      ))
      .orderBy(jobs.shiftStartDate);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async deleteJob(id: number): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  // Proposal operations
  async getAllProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }

  async getProposalsByLead(leadId: number): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(eq(proposals.leadId, leadId))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposalsByStatus(status: string): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(eq(proposals.status, status))
      .orderBy(desc(proposals.createdAt));
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db
      .insert(proposals)
      .values(insertProposal)
      .returning();
    return proposal;
  }

  async updateProposal(id: number, updates: Partial<InsertProposal>): Promise<Proposal> {
    const [proposal] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return proposal;
  }

  async deleteProposal(id: number): Promise<void> {
    await db.delete(proposals).where(eq(proposals.id, id));
  }

  // Communication log operations
  async getCommunicationLogs(leadId?: number, jobId?: number): Promise<CommunicationLog[]> {
    const conditions = [];
    if (leadId) conditions.push(eq(communicationLogs.leadId, leadId));
    if (jobId) conditions.push(eq(communicationLogs.jobId, jobId));
    
    return await db.select().from(communicationLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(communicationLogs.createdAt));
  }

  async createCommunicationLog(insertLog: InsertCommunicationLog): Promise<CommunicationLog> {
    const [log] = await db
      .insert(communicationLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  // User availability operations
  async getUserAvailability(userId: number): Promise<UserAvailability[]> {
    return await db.select().from(userAvailability)
      .where(eq(userAvailability.userId, userId))
      .orderBy(userAvailability.dayOfWeek);
  }

  async setUserAvailability(insertAvailability: InsertUserAvailability): Promise<UserAvailability> {
    const [availability] = await db
      .insert(userAvailability)
      .values(insertAvailability)
      .onConflictDoUpdate({
        target: [userAvailability.userId, userAvailability.dayOfWeek],
        set: {
          startTime: insertAvailability.startTime,
          endTime: insertAvailability.endTime,
          isAvailable: insertAvailability.isAvailable,
        },
      })
      .returning();
    return availability;
  }

  async getAvailableUsers(dayOfWeek: number, startTime: string, endTime: string): Promise<User[]> {
    const availableUserIds = await db.select({ userId: userAvailability.userId })
      .from(userAvailability)
      .where(and(
        eq(userAvailability.dayOfWeek, dayOfWeek),
        eq(userAvailability.isAvailable, true),
        lte(userAvailability.startTime, startTime),
        gte(userAvailability.endTime, endTime)
      ));

    if (availableUserIds.length === 0) return [];

    const userIds = availableUserIds.map(u => u.userId).filter(id => id !== null);
    if (userIds.length === 0) return [];

    return await db.select().from(users)
      .where(inArray(users.id, userIds));
  }
}

export const storage = new DatabaseStorage();