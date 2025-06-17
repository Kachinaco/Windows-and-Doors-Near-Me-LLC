import { pgTable, text, serial, timestamp, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enhanced users table with role-based access
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

// Dedicated clients table for customer information
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  jobTitle: text("job_title"),
  website: text("website"),
  lastInteraction: timestamp("last_interaction"),
  additionalInfo: text("additional_info"),
  leadSource: text("lead_source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table for customer projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  serviceType: text("service_type").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  estimatedCost: text("estimated_cost"),
  actualCost: text("actual_cost"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  leadSource: text("lead_source"),
  completedDate: timestamp("completed_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks within projects
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, done
  priority: text("priority").notNull().default("medium"),
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project updates and communication
export const projectUpdates = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  type: text("type").notNull().default("comment"), // comment, status_change, file_upload
  metadata: jsonb("metadata"), // for storing additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced contact submissions
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

// Consultation appointments scheduling
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  employeeId: integer("employee_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull().default(60), // duration in minutes
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled, no_show
  serviceType: text("service_type").notNull(),
  address: text("address"),
  consultationType: text("consultation_type").notNull().default("in_home"), // in_home, virtual, showroom
  notes: text("notes"),
  estimatedCost: text("estimated_cost"),
  followUpRequired: boolean("follow_up_required").default(false),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedProjects: many(projects, { relationName: "assignedProjects" }),
  assignedTasks: many(tasks),
  projectUpdates: many(projectUpdates),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  consultations: many(consultations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  assignedEmployee: one(users, {
    fields: [projects.assignedTo],
    references: [users.id],
    relationName: "assignedProjects",
  }),
  tasks: many(tasks),
  updates: many(projectUpdates),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignedEmployee: one(users, {
    fields: [tasks.assignedTo],
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

export const consultationsRelations = relations(consultations, ({ one }) => ({
  client: one(clients, {
    fields: [consultations.clientId],
    references: [clients.id],
  }),
  employee: one(users, {
    fields: [consultations.employeeId],
    references: [users.id],
  }),
}));

// Validation schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectUpdateSchema = createInsertSchema(projectUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
