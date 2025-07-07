import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').default('customer'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  created_at: timestamp('created_at').defaultNow(),
});

// Boards table
export const boards = pgTable('boards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Board columns table
export const boardColumns = pgTable('board_columns', {
  id: serial('id').primaryKey(),
  board_id: integer('board_id').references(() => boards.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // text, status, date, people, number, tags, etc.
  order: integer('order').default(0),
  settings: jsonb('settings'), // column-specific settings
  created_at: timestamp('created_at').defaultNow(),
});

// Board items table
export const boardItems = pgTable('board_items', {
  id: serial('id').primaryKey(),
  board_id: integer('board_id').references(() => boards.id),
  group_name: text('group_name').default('Main Group'),
  order: integer('order').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Board item values table
export const boardItemValues = pgTable('board_item_values', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id').references(() => boardItems.id),
  column_id: integer('column_id').references(() => boardColumns.id),
  value: text('value'), // stored as JSON string for complex values
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Board folders table (for sub-items organization)
export const boardFolders = pgTable('board_folders', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id').references(() => boardItems.id),
  name: text('name').notNull(),
  collapsed: boolean('collapsed').default(false),
  order: integer('order').default(0),
  created_at: timestamp('created_at').defaultNow(),
});

// Board sub-items table
export const boardSubItems = pgTable('board_sub_items', {
  id: serial('id').primaryKey(),
  folder_id: integer('folder_id').references(() => boardFolders.id),
  item_id: integer('item_id').references(() => boardItems.id),
  order: integer('order').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Board sub-item values table
export const boardSubItemValues = pgTable('board_sub_item_values', {
  id: serial('id').primaryKey(),
  sub_item_id: integer('sub_item_id').references(() => boardSubItems.id),
  column_id: integer('column_id').references(() => boardColumns.id),
  value: text('value'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Create insert and select schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, created_at: true });
export const selectUserSchema = createSelectSchema(users);
export const insertBoardSchema = createInsertSchema(boards).omit({ id: true, created_at: true, updated_at: true });
export const selectBoardSchema = createSelectSchema(boards);
export const insertBoardColumnSchema = createInsertSchema(boardColumns).omit({ id: true, created_at: true });
export const selectBoardColumnSchema = createSelectSchema(boardColumns);
export const insertBoardItemSchema = createInsertSchema(boardItems).omit({ id: true, created_at: true, updated_at: true });
export const selectBoardItemSchema = createSelectSchema(boardItems);
export const insertBoardItemValueSchema = createInsertSchema(boardItemValues).omit({ id: true, created_at: true, updated_at: true });
export const selectBoardItemValueSchema = createSelectSchema(boardItemValues);
export const insertBoardFolderSchema = createInsertSchema(boardFolders).omit({ id: true, created_at: true });
export const selectBoardFolderSchema = createSelectSchema(boardFolders);
export const insertBoardSubItemSchema = createInsertSchema(boardSubItems).omit({ id: true, created_at: true, updated_at: true });
export const selectBoardSubItemSchema = createSelectSchema(boardSubItems);
export const insertBoardSubItemValueSchema = createInsertSchema(boardSubItemValues).omit({ id: true, created_at: true, updated_at: true });
export const selectBoardSubItemValueSchema = createSelectSchema(boardSubItemValues);

// Type definitions
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Board = z.infer<typeof selectBoardSchema>;
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type BoardColumn = z.infer<typeof selectBoardColumnSchema>;
export type InsertBoardColumn = z.infer<typeof insertBoardColumnSchema>;
export type BoardItem = z.infer<typeof selectBoardItemSchema>;
export type InsertBoardItem = z.infer<typeof insertBoardItemSchema>;
export type BoardItemValue = z.infer<typeof selectBoardItemValueSchema>;
export type InsertBoardItemValue = z.infer<typeof insertBoardItemValueSchema>;
export type BoardFolder = z.infer<typeof selectBoardFolderSchema>;
export type InsertBoardFolder = z.infer<typeof insertBoardFolderSchema>;
export type BoardSubItem = z.infer<typeof selectBoardSubItemSchema>;
export type InsertBoardSubItem = z.infer<typeof insertBoardSubItemSchema>;
export type BoardSubItemValue = z.infer<typeof selectBoardSubItemValueSchema>;
export type InsertBoardSubItemValue = z.infer<typeof insertBoardSubItemValueSchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Project schema (aliases for boards for compatibility)
export const insertProjectSchema = insertBoardSchema;
export const projects = boards; // table alias
export type Project = Board;
export type InsertProject = InsertBoard;