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
  companyPosts,
  postViews,
  leads,
  jobs,
  proposals,
  proposalInvoices,
  proposalContracts,
  proposalPayments,
  proposalTemplates,
  communicationLogs,
  userAvailability,
  projectUpdates,
  companySettings,
  contracts,
  contractTemplates,
  invoices,
  clientMessages,
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
  type CompanyPost,
  type InsertCompanyPost,
  type PostView,
  type InsertPostView,
  type CompanySettings,
  type InsertCompanySettings,
  type Contract,
  type InsertContract,
  type Lead,
  type InsertLead,
  type Job,
  type InsertJob,
  type Proposal,
  type InsertProposal,
  type ProposalInvoice,
  type InsertProposalInvoice,
  type ProposalContract,
  type InsertProposalContract,
  type ProposalPayment,
  type InsertProposalPayment,
  type CommunicationLog,
  type InsertCommunicationLog,
  type UserAvailability,
  type InsertUserAvailability,
  type ContractTemplate,
  type InsertContractTemplate,
  type Invoice,
  type InsertInvoice,
  type ClientMessage,
  type InsertClientMessage,

  type ProjectUpdate,
  type InsertProjectUpdate,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, gte, lte, inArray, sql } from "drizzle-orm";
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
  getProjectsByStatus(status: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteOldTrashedProjects(cutoffDate: Date): Promise<number>;
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
  getAllProjectUpdates(): Promise<any[]>;
  getProjectUpdates(projectId: number): Promise<ProjectUpdate[]>;
  createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate>;

  // Contract management operations
  getAllContracts(): Promise<Contract[]>;
  getContractById(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, updates: Partial<InsertContract>): Promise<Contract>;
  
  // Contract template operations
  getAllContractTemplates(): Promise<ContractTemplate[]>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  
  // Proposal operations
  getAllProposals(): Promise<Proposal[]>;
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposalsByStatus(status: string): Promise<Proposal[]>;
  getProposalsByProject(projectId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, updates: Partial<InsertProposal>): Promise<Proposal>;

  // Proposal invoice operations
  getProposalInvoice(id: number): Promise<ProposalInvoice | undefined>;
  createProposalInvoice(invoice: InsertProposalInvoice): Promise<ProposalInvoice>;
  updateProposalInvoice(id: number, updates: Partial<InsertProposalInvoice>): Promise<ProposalInvoice>;

  // Proposal contract operations
  getProposalContract(id: number): Promise<ProposalContract | undefined>;
  createProposalContract(contract: InsertProposalContract): Promise<ProposalContract>;
  updateProposalContract(id: number, updates: Partial<InsertProposalContract>): Promise<ProposalContract>;

  // Proposal payment operations
  getProposalPayment(id: number): Promise<ProposalPayment | undefined>;
  createProposalPayment(payment: InsertProposalPayment): Promise<ProposalPayment>;
  updateProposalPayment(id: number, updates: Partial<InsertProposalPayment>): Promise<ProposalPayment>;

  // Proposal template operations
  getAllProposalTemplates(): Promise<ProposalTemplate[]>;
  getProposalTemplatesByType(templateType: string): Promise<ProposalTemplate[]>;
  createProposalTemplate(template: InsertProposalTemplate): Promise<ProposalTemplate>;
  updateProposalTemplate(id: number, updates: Partial<InsertProposalTemplate>): Promise<ProposalTemplate>;
  
  // Invoice operations
  getAllInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  
  // Client message operations
  getAllClientMessages(): Promise<ClientMessage[]>;
  getClientMessages(clientId: number): Promise<ClientMessage[]>;
  createClientMessage(message: InsertClientMessage): Promise<ClientMessage>;
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

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.projectStatus, status))
      .orderBy(desc(projects.updatedAt));
  }

  async deleteOldTrashedProjects(cutoffDate: Date): Promise<number> {
    const result = await db
      .delete(projects)
      .where(and(
        eq(projects.projectStatus, 'trashed'),
        lte(projects.trashedAt, cutoffDate)
      ));
    return result.rowCount || 0;
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

  // Company posts operations
  async getAllCompanyPosts(): Promise<CompanyPost[]> {
    return await db.select().from(companyPosts).orderBy(desc(companyPosts.createdAt));
  }

  async getCompanyPost(id: number): Promise<CompanyPost | undefined> {
    const [post] = await db.select().from(companyPosts).where(eq(companyPosts.id, id));
    return post;
  }

  async createCompanyPost(insertCompanyPost: InsertCompanyPost): Promise<CompanyPost> {
    const [post] = await db
      .insert(companyPosts)
      .values(insertCompanyPost)
      .returning();
    return post;
  }

  // Post view operations
  async recordPostView(postId: number, userId: number): Promise<void> {
    try {
      await db
        .insert(postViews)
        .values({ postId, userId })
        .onConflictDoNothing();
      
      // Update views count
      const currentPost = await db.select().from(companyPosts).where(eq(companyPosts.id, postId)).limit(1);
      if (currentPost.length > 0) {
        await db
          .update(companyPosts)
          .set({ 
            viewsCount: (currentPost[0].viewsCount || 0) + 1
          })
          .where(eq(companyPosts.id, postId));
      }
    } catch (error) {
      // Ignore conflicts - user already viewed this post
    }
  }

  async getPostViewers(postId: number): Promise<{ user: User; viewedAt: Date }[]> {
    const views = await db
      .select({
        user: users,
        viewedAt: postViews.viewedAt,
      })
      .from(postViews)
      .innerJoin(users, eq(postViews.userId, users.id))
      .where(eq(postViews.postId, postId))
      .orderBy(desc(postViews.viewedAt));
    
    return views;
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
    console.log("Storage createLead received:", insertLead);
    
    // Ensure required fields are present
    const leadData = {
      ...insertLead,
      firstName: insertLead.firstName || 'Unknown',
      lastName: insertLead.lastName || 'Lead',
      source: insertLead.source || 'website'
    };
    
    console.log("Storage createLead using:", leadData);
    
    const [lead] = await db
      .insert(leads)
      .values(leadData)
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
      .values({
        title: insertProposal.title,
        projectId: insertProposal.projectId,
        createdById: insertProposal.createdBy,
        clientName: insertProposal.clientName,
        clientEmail: insertProposal.clientEmail,
        clientPhone: insertProposal.clientPhone,
        projectAddress: insertProposal.projectAddress,
        description: insertProposal.description,
        totalAmount: insertProposal.totalAmount,
        status: insertProposal.status || "draft",
      })
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

  // Project updates operations
  async getAllProjectUpdates(): Promise<any[]> {
    return await db.select({
      id: projectUpdates.id,
      projectId: projectUpdates.projectId,
      updateType: projectUpdates.type,
      message: projectUpdates.message,
      performedBy: projectUpdates.userId,
      metadata: projectUpdates.metadata,
      createdAt: projectUpdates.createdAt
    }).from(projectUpdates)
      .orderBy(desc(projectUpdates.createdAt));
  }

  async getProjectUpdates(projectId: number): Promise<ProjectUpdate[]> {
    return await db.select().from(projectUpdates)
      .where(eq(projectUpdates.projectId, projectId))
      .orderBy(desc(projectUpdates.createdAt));
  }

  async createProjectUpdate(update: any): Promise<ProjectUpdate> {
    const [newUpdate] = await db
      .insert(projectUpdates)
      .values({
        projectId: update.projectId,
        userId: update.performedBy || update.userId,
        message: update.message,
        type: update.updateType || update.type,
        metadata: update.metadata
      })
      .returning();
    return newUpdate;
  }

  // Company settings operations
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async updateCompanySettings(updates: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const existingSettings = await this.getCompanySettings();
    
    if (existingSettings) {
      const [settings] = await db
        .update(companySettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(companySettings.id, existingSettings.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(companySettings)
        .values(updates)
        .returning();
      return settings;
    }
  }

  // Contract management operations
  async getAllContracts(): Promise<Contract[]> {
    return await db.select().from(contracts)
      .leftJoin(users, eq(contracts.clientId, users.id))
      .leftJoin(projects, eq(contracts.projectId, projects.id))
      .orderBy(desc(contracts.createdAt));
  }

  async getContractById(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts)
      .leftJoin(users, eq(contracts.clientId, users.id))
      .leftJoin(projects, eq(contracts.projectId, projects.id))
      .where(eq(contracts.id, id));
    return contract ? contract.contracts : undefined;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async updateContract(id: number, updates: Partial<InsertContract>): Promise<Contract> {
    const [contract] = await db
      .update(contracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  // Contract template operations
  async getAllContractTemplates(): Promise<ContractTemplate[]> {
    return await db.select().from(contractTemplates)
      .orderBy(desc(contractTemplates.createdAt));
  }

  async createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate> {
    const [newTemplate] = await db
      .insert(contractTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  // Proposal template operations
  async getAllProposalTemplates(): Promise<ProposalTemplate[]> {
    return await db.select().from(proposalTemplates)
      .orderBy(desc(proposalTemplates.createdAt));
  }

  async createProposalTemplate(template: InsertProposalTemplate): Promise<ProposalTemplate> {
    const [newTemplate] = await db
      .insert(proposalTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  // Invoice operations
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .leftJoin(users, eq(invoices.clientId, users.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  // Client message operations
  async getAllClientMessages(): Promise<ClientMessage[]> {
    return await db.select().from(clientMessages)
      .leftJoin(users, eq(clientMessages.clientId, users.id))
      .orderBy(desc(clientMessages.sentAt));
  }

  async getClientMessages(clientId: number): Promise<ClientMessage[]> {
    return await db.select().from(clientMessages)
      .where(eq(clientMessages.clientId, clientId))
      .orderBy(desc(clientMessages.sentAt));
  }

  async createClientMessage(message: InsertClientMessage): Promise<ClientMessage> {
    const [newMessage] = await db
      .insert(clientMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Proposal operations
  async getAllProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal || undefined;
  }

  async getProposalsByStatus(status: string): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(eq(proposals.status, status))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposalsByProject(projectId: number): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(eq(proposals.projectId, projectId))
      .orderBy(desc(proposals.createdAt));
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    // Use raw SQL to avoid column mapping issues
    const result = await pool.query(`
      INSERT INTO proposals (
        title, description, total_amount, project_id, created_by_id, 
        client_name, client_email, client_phone, project_address, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING *
    `, [
      proposal.title, 
      proposal.description, 
      proposal.totalAmount, 
      proposal.projectId, 
      proposal.createdBy, 
      proposal.clientName, 
      proposal.clientEmail, 
      proposal.clientPhone, 
      proposal.projectAddress, 
      proposal.status || 'draft'
    ]);
    
    return result.rows[0] as Proposal;
  }

  async updateProposal(id: number, updates: Partial<InsertProposal>): Promise<Proposal> {
    const [proposal] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return proposal;
  }

  // Proposal invoice operations
  async getProposalInvoice(id: number): Promise<ProposalInvoice | undefined> {
    const [invoice] = await db.select().from(proposalInvoices).where(eq(proposalInvoices.id, id));
    return invoice || undefined;
  }

  async createProposalInvoice(invoice: InsertProposalInvoice): Promise<ProposalInvoice> {
    const [newInvoice] = await db
      .insert(proposalInvoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateProposalInvoice(id: number, updates: Partial<InsertProposalInvoice>): Promise<ProposalInvoice> {
    const [invoice] = await db
      .update(proposalInvoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposalInvoices.id, id))
      .returning();
    return invoice;
  }

  // Proposal contract operations
  async getProposalContract(id: number): Promise<ProposalContract | undefined> {
    const [contract] = await db.select().from(proposalContracts).where(eq(proposalContracts.id, id));
    return contract || undefined;
  }

  async createProposalContract(contract: InsertProposalContract): Promise<ProposalContract> {
    const [newContract] = await db
      .insert(proposalContracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async updateProposalContract(id: number, updates: Partial<InsertProposalContract>): Promise<ProposalContract> {
    const [contract] = await db
      .update(proposalContracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposalContracts.id, id))
      .returning();
    return contract;
  }

  // Proposal payment operations
  async getProposalPayment(id: number): Promise<ProposalPayment | undefined> {
    const [payment] = await db.select().from(proposalPayments).where(eq(proposalPayments.id, id));
    return payment || undefined;
  }

  async createProposalPayment(payment: InsertProposalPayment): Promise<ProposalPayment> {
    const [newPayment] = await db
      .insert(proposalPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updateProposalPayment(id: number, updates: Partial<InsertProposalPayment>): Promise<ProposalPayment> {
    const [payment] = await db
      .update(proposalPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposalPayments.id, id))
      .returning();
    return payment;
  }

  // Proposal template operations
  async getProposalTemplatesByType(templateType: string): Promise<ProposalTemplate[]> {
    return await db.select().from(proposalTemplates)
      .where(eq(proposalTemplates.templateType, templateType))
      .orderBy(desc(proposalTemplates.createdAt));
  }

  async updateProposalTemplate(id: number, updates: Partial<InsertProposalTemplate>): Promise<ProposalTemplate> {
    const [template] = await db
      .update(proposalTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposalTemplates.id, id))
      .returning();
    return template;
  }
}

export const storage = new DatabaseStorage();