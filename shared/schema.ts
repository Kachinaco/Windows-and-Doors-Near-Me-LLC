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
  customizations: jsonb("customizations"), // size, color, options
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order management
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, confirmed, shipped, delivered, cancelled
  totalAmount: text("total_amount").notNull(),
  shippingAddress: jsonb("shipping_address"),
  items: jsonb("items"), // array of order items
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contact form submissions for lead generation
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, contacted, quoted, converted, closed
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Window/Door quote requests with configuration
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  projectAddress: text("project_address"),
  windowConfigurations: jsonb("window_configurations"), // array of window specs
  totalEstimate: decimal("total_estimate", { precision: 10, scale: 2 }),
  installationRequested: boolean("installation_requested").default(false),
  status: text("status").notNull().default("pending"), // pending, reviewed, quoted, approved, declined
  assignedTo: integer("assigned_to").references(() => users.id),
  convertedToProjectId: integer("converted_to_project_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quote activity tracking
export const quoteActivities = pgTable("quote_activities", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quoteRequests.id),
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(), // status_change, note_added, email_sent
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // additional activity data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced project management
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planning"), // planning, active, on_hold, completed, cancelled
  priority: text("priority").default("medium"), // low, medium, high, urgent
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  assignedTo: integer("assigned_to").references(() => users.id),
  clientId: integer("client_id"),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  projectAddress: text("project_address"),
  projectStatus: text("project_status").notNull().default("active"), // active, archived, trashed
  trashedAt: timestamp("trashed_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sub-items for hierarchical project structure
export const subItems = pgTable("sub_items", {
  id: serial("id").primaryKey(),
  parentProjectId: integer("parent_project_id").references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed, blocked
  priority: text("priority").default("medium"), // low, medium, high, urgent
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  folderId: integer("folder_id"), // For organizing sub-items into folders
  folderName: text("folder_name"), // Name of the folder this belongs to
  sortOrder: integer("sort_order").default(0), // For custom ordering within folders
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  tags: jsonb("tags"), // Array of tags for categorization
  metadata: jsonb("metadata"), // Additional custom field data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sub-item folders for organization
export const subItemFolders = pgTable("sub_item_folders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("blue"), // Folder color for visual organization
  sortOrder: integer("sort_order").default(0),
  isCollapsed: boolean("is_collapsed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project team members - link users to specific projects
export const projectTeamMembers = pgTable("project_team_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member"), // member, lead, admin, viewer
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure each user can only be added once per project
  uniqueProjectUser: unique().on(table.projectId, table.userId)
}));

// User invitations for new team members
export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").default("member"),
  notes: text("notes"),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  inviteToken: text("invite_token").notNull().unique(), // UUID for secure invitation
  status: text("status").default("pending"), // pending, accepted, expired, cancelled
  expiresAt: timestamp("expires_at").notNull(), // 7 days from creation
  acceptedAt: timestamp("accepted_at"),
  userId: integer("user_id").references(() => users.id), // Set when invitation is accepted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project updates and communication
export const projectUpdates = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type<Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>>().default([]),
  mentions: jsonb("mentions").$type<Array<{
    userId: number;
    username: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// Contracts management
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  clientId: integer("client_id").references(() => users.id),
  contractorId: integer("contractor_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  terms: text("terms").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  paymentSchedule: jsonb("payment_schedule"), // milestone-based payments
  status: text("status").notNull().default("draft"), // draft, sent, signed, completed, cancelled
  signedDate: timestamp("signed_date"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contract templates for reusability
export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(), // HTML template content
  category: text("category"), // window-installation, door-installation, full-service
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enhanced invoicing system
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  clientId: integer("client_id").references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  lineItems: jsonb("line_items"), // array of invoice line items
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client messaging system
export const clientMessages = pgTable("client_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  senderId: integer("sender_id").references(() => users.id),
  recipientId: integer("recipient_id").references(() => users.id),
  subject: text("subject"),
  content: text("content").notNull(),
  messageType: text("message_type").default("general"), // general, update, question, file
  attachments: jsonb("attachments"),
  isRead: boolean("is_read").default(false),
  templateId: integer("template_id"),
  automationTriggered: boolean("automation_triggered"),
  status: text("status").default("sent"), // sent, delivered, read
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Automation workflows
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // project_status_change, time_based, manual
  triggerConditions: jsonb("trigger_conditions"),
  actions: jsonb("actions"), // array of automated actions
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflow execution log
export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id),
  projectId: integer("project_id").references(() => projects.id),
  triggeredBy: text("triggered_by"), // user_action, system_event
  executionStatus: text("execution_status").notNull(), // pending, completed, failed
  actionsExecuted: jsonb("actions_executed"),
  errorLog: text("error_log"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

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

// Company settings for API integrations
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name"),
  businessAddress: text("business_address"),
  businessWebsite: text("business_website"),
  licenseNumber: text("license_number"),
  openphoneApiKey: text("openphone_api_key"),
  openphoneWebhookUrl: text("openphone_webhook_url"),
  businessPhoneNumber: text("business_phone_number"),
  gmailClientId: text("gmail_client_id"),
  gmailClientSecret: text("gmail_client_secret"),
  gmailRefreshToken: text("gmail_refresh_token"),
  stripeApiKey: text("stripe_api_key"),
  sendgridApiKey: text("sendgrid_api_key"),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  enableOpenphoneSync: boolean("enable_openphone_sync").default(false),
  enableGmailSync: boolean("enable_gmail_sync").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// Communication logs for CRM
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  projectId: integer("project_id").references(() => projects.id),
  jobId: integer("job_id").references(() => jobs.id),
  userId: integer("user_id").references(() => users.id),
  communicationType: varchar("communication_type", { length: 50 }).notNull(), // call, sms, email
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  duration: integer("duration_seconds"), // for calls
  phoneNumber: varchar("phone_number", { length: 20 }),
  emailAddress: varchar("email_address", { length: 255 }),
  status: varchar("status", { length: 50 }).default("completed"), // completed, failed, pending
  externalId: varchar("external_id", { length: 255 }), // OpenPhone/Gmail message ID
  metadata: jsonb("metadata"), // additional platform-specific data
  createdAt: timestamp("created_at").defaultNow(),
});

// User availability for scheduling
export const userAvailability = pgTable("user_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6, Sunday = 0
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS format
  endTime: varchar("end_time", { length: 8 }).notNull(),
  isAvailable: boolean("is_available").default(true),
  timeZone: varchar("time_zone", { length: 50 }).default("America/Phoenix"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== COMPREHENSIVE PROPOSAL SYSTEM =====

// Main proposals table - HoneyBook style
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id"),
  projectId: integer("project_id").references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  fileUrl: varchar("file_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  invoiceId: integer("invoice_id"),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  projectAddress: text("project_address"),
  contractId: integer("contract_id"),
  paymentId: integer("payment_id"),
  headerImages: jsonb("header_images").$type<string[]>().default([]),
});

// Proposal invoices with detailed line items
export const proposalInvoices = pgTable("proposal_invoices", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  lineItems: jsonb("line_items").$type<Array<{
    serviceName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  creditCardFeePercentage: decimal("cc_fee_percentage", { precision: 5, scale: 2 }).default("3.5"),
  creditCardFeeAmount: decimal("cc_fee_amount", { precision: 10, scale: 2 }).default("0"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  nextMilestoneDue: timestamp("next_milestone_due"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Proposal contracts with electronic signatures
export const proposalContracts = pgTable("proposal_contracts", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  contractText: text("contract_text").notNull(),
  smartFields: jsonb("smart_fields").$type<Record<string, string>>().default({}),
  clausesEnabled: jsonb("clauses_enabled").$type<{
    scopeOfWork: boolean;
    lifetimeWarranty: boolean;
    changeOrders: boolean;
    clientResponsibilities: boolean;
    paymentTerms: boolean;
    cancellationRescheduling: boolean;
    noticePeriodHours: number;
    forceMajeure: boolean;
    noShowPolicy: boolean;
    disputeResolution: boolean;
  }>().default({
    scopeOfWork: true,
    lifetimeWarranty: true,
    changeOrders: true,
    clientResponsibilities: true,
    paymentTerms: true,
    cancellationRescheduling: true,
    noticePeriodHours: 48,
    forceMajeure: true,
    noShowPolicy: true,
    disputeResolution: true,
  }),
  contractorSignature: jsonb("contractor_signature").$type<{
    name: string;
    signature: string;
    timestamp: string;
    ipAddress: string;
  }>(),
  clientSignature: jsonb("client_signature").$type<{
    name: string;
    signature: string;
    timestamp: string;
    ipAddress: string;
  }>(),
  signedByContractor: boolean("signed_by_contractor").default(false),
  signedByClient: boolean("signed_by_client").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Proposal payments with milestone tracking
export const proposalPayments = pgTable("proposal_payments", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  milestones: jsonb("milestones").$type<Array<{
    id: string;
    name: string;
    dueDate: string;
    amount: number;
    status: "upcoming" | "paid" | "late" | "processing";
    paymentMethod: string | null;
    transactionId: string | null;
    paidAt: string | null;
  }>>().notNull(),
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0"),
  tipPercentage: decimal("tip_percentage", { precision: 5, scale: 2 }).default("0"),
  autopayEnabled: boolean("autopay_enabled").default(false),
  savedPaymentMethodId: text("saved_payment_method_id"), // Stripe payment method ID
  stripeCustomerId: text("stripe_customer_id"),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"),
  remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Proposal templates for reusability
export const proposalTemplates = pgTable("proposal_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").notNull(), // invoice, contract, full_proposal
  templateData: jsonb("template_data").notNull(),
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== CRM ANALYTICS TABLES =====

export const leadMetrics = pgTable("lead_metrics", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  sourceTrackingData: jsonb("source_tracking_data"),
  responseTime: integer("response_time_minutes"),
  conversionProbability: decimal("conversion_probability", { precision: 5, scale: 2 }),
  touchpointCount: integer("touchpoint_count").default(0),
  lastInteractionDate: timestamp("last_interaction_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectMetrics = pgTable("project_metrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }),
  timeToCompletion: integer("time_to_completion_days"),
  customerSatisfactionScore: decimal("customer_satisfaction_score", { precision: 3, scale: 1 }),
  changeOrderCount: integer("change_order_count").default(0),
  costOverrunPercentage: decimal("cost_overrun_percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const salesMetrics = pgTable("sales_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // monthly, quarterly, yearly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  leadsGenerated: integer("leads_generated").default(0),
  leadsConverted: integer("leads_converted").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  averageDealSize: decimal("average_deal_size", { precision: 10, scale: 2 }).default("0"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerInteractions = pgTable("customer_interactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(), // can reference leads or users
  customerType: varchar("customer_type", { length: 20 }).notNull(), // lead, customer
  interactionType: varchar("interaction_type", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 30 }).notNull(), // phone, email, sms, in_person, web
  outcome: varchar("outcome", { length: 50 }),
  notes: text("notes"),
  performedBy: integer("performed_by").references(() => users.id),
  relatedProjectId: integer("related_project_id").references(() => projects.id),
  relatedQuoteId: integer("related_quote_id").references(() => quoteRequests.id),
  relatedJobId: integer("related_job_id").references(() => jobs.id),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pipelineAnalytics = pgTable("pipeline_analytics", {
  id: serial("id").primaryKey(),
  stage: varchar("stage", { length: 50 }).notNull(),
  count: integer("count").default(0),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).default("0"),
  averageTimeInStage: integer("average_time_in_stage_days"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  calculatedDate: timestamp("calculated_date").defaultNow().notNull(),
});



// ===== RELATIONS =====

export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems),
  orders: many(orders),
  assignedQuoteRequests: many(quoteRequests),
  quoteActivities: many(quoteActivities),
  assignedLeads: many(leads),
  assignedJobs: many(jobs),
  communicationLogs: many(communicationLogs),
  availability: many(userAvailability),
  salesMetrics: many(salesMetrics),
  interactions: many(customerInteractions),
  assignedProjects: many(projects),
  createdProposals: many(proposals),
  projectUpdates: many(projectUpdates),
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
  activities: many(quoteActivities),
}));

export const quoteActivitiesRelations = relations(quoteActivities, ({ one }) => ({
  quote: one(quoteRequests, {
    fields: [quoteActivities.quoteId],
    references: [quoteRequests.id],
  }),
  user: one(users, {
    fields: [quoteActivities.userId],
    references: [users.id],
  }),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpdates.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [projectUpdates.authorId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  updates: many(projectUpdates),
  assignedUser: one(users, {
    fields: [projects.assignedTo],
    references: [users.id],
  }),
  jobs: many(jobs),
  proposals: many(proposals),
  subItems: many(subItems),
  subItemFolders: many(subItemFolders),
  metrics: one(projectMetrics),
  interactions: many(customerInteractions),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

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

// Proposal system relations
export const proposalsRelations = relations(proposals, ({ one }) => ({
  project: one(projects, {
    fields: [proposals.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [proposals.createdById],
    references: [users.id],
  }),
}));

export const proposalInvoicesRelations = relations(proposalInvoices, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalInvoices.proposalId],
    references: [proposals.id],
  }),
}));

// Sub-items relations
export const subItemsRelations = relations(subItems, ({ one }) => ({
  project: one(projects, {
    fields: [subItems.parentProjectId],
    references: [projects.id],
  }),
  assignedUser: one(users, {
    fields: [subItems.assignedTo],
    references: [users.id],
  }),
}));

export const subItemFoldersRelations = relations(subItemFolders, ({ one, many }) => ({
  project: one(projects, {
    fields: [subItemFolders.projectId],
    references: [projects.id],
  }),
}));

export const proposalContractsRelations = relations(proposalContracts, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalContracts.proposalId],
    references: [proposals.id],
  }),
}));

export const proposalPaymentsRelations = relations(proposalPayments, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalPayments.proposalId],
    references: [proposals.id],
  }),
}));

export const proposalTemplatesRelations = relations(proposalTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [proposalTemplates.createdBy],
    references: [users.id],
  }),
}));

// CRM analytics relations
export const leadMetricsRelations = relations(leadMetrics, ({ one }) => ({
  lead: one(leads, {
    fields: [leadMetrics.leadId],
    references: [leads.id],
  }),
}));

export const projectMetricsRelations = relations(projectMetrics, ({ one }) => ({
  project: one(projects, {
    fields: [projectMetrics.projectId],
    references: [projects.id],
  }),
}));

export const salesMetricsRelations = relations(salesMetrics, ({ one }) => ({
  user: one(users, {
    fields: [salesMetrics.userId],
    references: [users.id],
  }),
}));

export const customerInteractionsRelations = relations(customerInteractions, ({ one }) => ({
  performedByUser: one(users, {
    fields: [customerInteractions.performedBy],
    references: [users.id],
  }),
  relatedProject: one(projects, {
    fields: [customerInteractions.relatedProjectId],
    references: [projects.id],
  }),
  relatedQuote: one(quoteRequests, {
    fields: [customerInteractions.relatedQuoteId],
    references: [quoteRequests.id],
  }),
  relatedJob: one(jobs, {
    fields: [customerInteractions.relatedJobId],
    references: [jobs.id],
  }),
}));

// ===== VALIDATION SCHEMAS =====

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
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubItemSchema = createInsertSchema(subItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubItemFolderSchema = createInsertSchema(subItemFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectTeamMemberSchema = createInsertSchema(projectTeamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertUserInvitationSchema = createInsertSchema(userInvitations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
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
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertUserAvailabilitySchema = createInsertSchema(userAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientMessageSchema = createInsertSchema(clientMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyPostSchema = createInsertSchema(companyPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostViewSchema = createInsertSchema(postViews).omit({
  id: true,
  viewedAt: true,
});

// Proposal system schemas
export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProposalInvoiceSchema = createInsertSchema(proposalInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProposalContractSchema = createInsertSchema(proposalContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProposalPaymentSchema = createInsertSchema(proposalPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProposalTemplateSchema = createInsertSchema(proposalTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ===== TYPE EXPORTS =====

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
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;

export type QuoteActivity = typeof quoteActivities.$inferSelect;
export type InsertQuoteActivity = z.infer<typeof insertQuoteActivitySchema>;

export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;

export type UserAvailability = typeof userAvailability.$inferSelect;
export type InsertUserAvailability = z.infer<typeof insertUserAvailabilitySchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type ClientMessage = typeof clientMessages.$inferSelect;
export type InsertClientMessage = z.infer<typeof insertClientMessageSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type CompanyPost = typeof companyPosts.$inferSelect;
export type InsertCompanyPost = z.infer<typeof insertCompanyPostSchema>;

export type PostView = typeof postViews.$inferSelect;
export type InsertPostView = z.infer<typeof insertPostViewSchema>;

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

// CRM Analytics types
export type LeadMetrics = typeof leadMetrics.$inferSelect;
export type ProjectMetrics = typeof projectMetrics.$inferSelect;
export type SalesMetrics = typeof salesMetrics.$inferSelect;
export type CustomerInteraction = typeof customerInteractions.$inferSelect;
export type PipelineAnalytics = typeof pipelineAnalytics.$inferSelect;

// Proposal system types
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type ProposalInvoice = typeof proposalInvoices.$inferSelect;
export type InsertProposalInvoice = z.infer<typeof insertProposalInvoiceSchema>;
export type ProposalContract = typeof proposalContracts.$inferSelect;
export type InsertProposalContract = z.infer<typeof insertProposalContractSchema>;
export type ProposalPayment = typeof proposalPayments.$inferSelect;
export type InsertProposalPayment = z.infer<typeof insertProposalPaymentSchema>;
export type ProposalTemplate = typeof proposalTemplates.$inferSelect;
export type InsertProposalTemplate = z.infer<typeof insertProposalTemplateSchema>;

// Sub-items types
export type SubItem = typeof subItems.$inferSelect;
export type InsertSubItem = z.infer<typeof insertSubItemSchema>;
export type SubItemFolder = typeof subItemFolders.$inferSelect;
export type InsertSubItemFolder = z.infer<typeof insertSubItemFolderSchema>;

// Project team and invitation types
export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type InsertProjectTeamMember = z.infer<typeof insertProjectTeamMemberSchema>;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;