import { pgTable, text, serial, timestamp, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
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

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;