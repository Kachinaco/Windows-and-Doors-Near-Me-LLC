import { pgTable, text, serial, timestamp, varchar, integer, boolean, jsonb, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enhanced users table with subscription tiers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  companyName: text("company_name"), // User's company name
  role: text("role").notNull().default("customer"), // customer, contractor_trial, contractor_paid, employee, admin
  subscriptionType: text("subscription_type").notNull().default("free"), // free, trial, paid
  subscriptionStatus: text("subscription_status").notNull().default("active"), // active, cancelled, expired
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Milgard product catalog
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // windows, doors
  subcategory: text("subcategory"), // single-hung, double-hung, sliding, french, etc.
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  specifications: jsonb("specifications"), // size, material, features, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shopping cart for customers
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  customizations: jsonb("customizations"), // size, color, hardware options
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer orders/quotes
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("quote"), // quote, approved, in_progress, completed
  totalAmount: text("total_amount"),
  customerInfo: jsonb("customer_info"), // name, email, phone, address
  items: jsonb("items"), // cart snapshot
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contact form submissions for sales leads
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  serviceNeeded: text("service_needed").notNull(),
  projectDetails: text("project_details"),
  status: text("status").notNull().default("new"), // new, contacted, converted, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Online quote requests with window configurations
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  projectAddress: text("project_address"),
  items: jsonb("items").notNull(), // Array of configured windows/doors
  totalEstimate: text("total_estimate").notNull(),
  status: text("status").notNull().default("pending"), // pending, reviewed, quoted, converted, closed
  priority: text("priority").notNull().default("normal"), // normal, high, urgent
  notes: text("notes"),
  needsInstallation: boolean("needs_installation").default(false), // Whether customer needs installation services
  followUpDate: timestamp("follow_up_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  convertedToProjectId: integer("converted_to_project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quote request activities/communications log
export const quoteActivities = pgTable("quote_activities", {
  id: serial("id").primaryKey(),
  quoteRequestId: integer("quote_request_id").references(() => quoteRequests.id),
  activityType: text("activity_type").notNull(), // created, email_sent, call_made, quote_sent, follow_up, converted
  description: text("description").notNull(),
  performedBy: integer("performed_by").references(() => users.id),
  metadata: jsonb("metadata"), // Additional data like email content, call duration, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project management for contractors (Monday.com style)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, paid, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  clientId: integer("client_id"),
  assignedTo: integer("assigned_to").references(() => users.id),
  estimatedCost: text("estimated_cost"),
  actualCost: text("actual_cost"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  completedAt: timestamp("completed_at"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project updates/activity feed
export const projectUpdates = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  type: text("type").notNull(), // status_change, comment, task_completion, priority_change, assignment, document, schedule
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems),
  orders: many(orders),
  assignedQuoteRequests: many(quoteRequests),
  quoteActivities: many(quoteActivities),
}));

export const productsRelations = relations(products, ({ many }) => ({
  cartItems: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [quoteRequests.assignedTo],
    references: [users.id],
  }),
  convertedProject: one(projects, {
    fields: [quoteRequests.convertedToProjectId],
    references: [projects.id],
  }),
  activities: many(quoteActivities),
}));

export const quoteActivitiesRelations = relations(quoteActivities, ({ one }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [quoteActivities.quoteRequestId],
    references: [quoteRequests.id],
  }),
  performedByUser: one(users, {
    fields: [quoteActivities.performedBy],
    references: [users.id],
  }),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpdates.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectUpdates.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  updates: many(projectUpdates),
}));

// Blog posts for home improvement tips
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // window-tips, door-tips, maintenance, energy-efficiency, installation
  tags: jsonb("tags"), // array of tag strings
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

// Company posts for internal social feed
export const companyPosts = pgTable("company_posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  feeling: text("feeling"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  viewsCount: integer("views_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Track who viewed which posts
export const postViews = pgTable("post_views", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => companyPosts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const companyPostsRelations = relations(companyPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [companyPosts.authorId],
    references: [users.id],
  }),
  views: many(postViews),
}));

export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(companyPosts, {
    fields: [postViews.postId],
    references: [companyPosts.id],
  }),
  user: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
}));

// Company settings for API integrations
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  openphoneApiKey: text("openphone_api_key"),
  openphoneWebhookUrl: text("openphone_webhook_url"),
  gmailClientId: text("gmail_client_id"),
  gmailClientSecret: text("gmail_client_secret"),
  gmailRefreshToken: text("gmail_refresh_token"),
  enableOpenphoneSync: boolean("enable_openphone_sync").default(false),
  enableGmailSync: boolean("enable_gmail_sync").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  quoteNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteActivitySchema = createInsertSchema(quoteActivities).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectUpdateSchema = createInsertSchema(projectUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;

export type QuoteActivity = typeof quoteActivities.$inferSelect;
export type InsertQuoteActivity = z.infer<typeof insertQuoteActivitySchema>;

export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// Leads table for lead management
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  source: varchar("source", { length: 50 }).notNull(), // website, yelp, thumbtack, phone
  status: varchar("status", { length: 50 }).default("new"), // new, contacted, estimate_sent, won, lost
  assignedToId: integer("assigned_to_id").references(() => users.id),
  notes: text("notes"),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs/Scheduling table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobName: varchar("job_name", { length: 255 }).notNull(),
  customerId: integer("customer_id").references(() => leads.id),
  projectId: integer("project_id").references(() => projects.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  teamMembers: integer("team_members").array(),
  customerSchedulingStatus: varchar("customer_scheduling_status", { length: 50 }).default("not_scheduled"), // not_scheduled, scheduled, completed
  contractorAcceptanceStatus: varchar("contractor_acceptance_status", { length: 50 }).default("pending"), // pending, accepted, declined
  shiftStartDate: timestamp("shift_start_date"),
  shiftEndDate: timestamp("shift_end_date"),
  duration: integer("duration_hours"),
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }),
  description: text("description"),
  requirements: text("requirements"),
  googleCalendarEventId: varchar("google_calendar_event_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proposals table
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  projectId: integer("project_id").references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("draft"), // draft, sent, approved, rejected
  fileUrl: varchar("file_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication logs for CRM
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  jobId: integer("job_id").references(() => jobs.id),
  type: varchar("type", { length: 50 }).notNull(), // call, sms, email
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  content: text("content"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  emailAddress: varchar("email_address", { length: 255 }),
  duration: integer("duration_seconds"), // for calls
  recordingUrl: varchar("recording_url", { length: 500 }),
  openPhoneId: varchar("open_phone_id", { length: 255 }),
  gmailThreadId: varchar("gmail_thread_id", { length: 255 }),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User availability for scheduling
export const userAvailability = pgTable("user_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: varchar("start_time", { length: 10 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 10 }).notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema validation
const insertLeadSchema = createInsertSchema(leads);
const insertJobSchema = createInsertSchema(jobs);
const insertProposalSchema = createInsertSchema(proposals);
const insertCommunicationLogSchema = createInsertSchema(communicationLogs);
const insertUserAvailabilitySchema = createInsertSchema(userAvailability);

// Relations
export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [leads.assignedToId],
    references: [users.id],
  }),
  jobs: many(jobs),
  proposals: many(proposals),
  communications: many(communicationLogs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(leads, {
    fields: [jobs.customerId],
    references: [leads.id],
  }),
  project: one(projects, {
    fields: [jobs.projectId],
    references: [projects.id],
  }),
  assignedTo: one(users, {
    fields: [jobs.assignedToId],
    references: [users.id],
  }),
  communications: many(communicationLogs),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  lead: one(leads, {
    fields: [proposals.leadId],
    references: [leads.id],
  }),
  project: one(projects, {
    fields: [proposals.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [proposals.createdById],
    references: [users.id],
  }),
}));

export const communicationLogsRelations = relations(communicationLogs, ({ one }) => ({
  lead: one(leads, {
    fields: [communicationLogs.leadId],
    references: [leads.id],
  }),
  job: one(jobs, {
    fields: [communicationLogs.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [communicationLogs.userId],
    references: [users.id],
  }),
}));

export const userAvailabilityRelations = relations(userAvailability, ({ one }) => ({
  user: one(users, {
    fields: [userAvailability.userId],
    references: [users.id],
  }),
}));

// Company posts schema
export const insertCompanyPostSchema = createInsertSchema(companyPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostViewSchema = createInsertSchema(postViews).omit({
  id: true,
  viewedAt: true,
});

// Types
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type UserAvailability = typeof userAvailability.$inferSelect;
export type InsertUserAvailability = z.infer<typeof insertUserAvailabilitySchema>;
export type CompanyPost = typeof companyPosts.$inferSelect;
export type InsertCompanyPost = z.infer<typeof insertCompanyPostSchema>;
export type PostView = typeof postViews.$inferSelect;
export type InsertPostView = z.infer<typeof insertPostViewSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;