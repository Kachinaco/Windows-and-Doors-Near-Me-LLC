import { pgTable, text, serial, timestamp, varchar, integer, boolean, jsonb, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Board management system - Monday.com style
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#0073ea"),
  icon: text("icon").default("📋"),
  ownerId: integer("owner_id").references(() => users.id),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  settings: jsonb("settings").default({}), // board-level settings
  isTemplate: boolean("is_template").default(false),
  isPublic: boolean("is_public").default(false),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workspaces to organize boards
export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#0073ea"),
  ownerId: integer("owner_id").references(() => users.id),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Column types enum for all Monday.com 2025 features
export enum ColumnType {
  TEXT = "text",
  LONG_TEXT = "long_text", 
  STATUS = "status",
  PRIORITY = "priority",
  PEOPLE = "people",
  DATE = "date",
  TIMELINE = "timeline",
  NUMBERS = "numbers",
  RATING = "rating",
  CHECKBOX = "checkbox",
  DROPDOWN = "dropdown",
  TAGS = "tags",
  FILES = "files",
  LINK = "link",
  EMAIL = "email",
  PHONE = "phone",
  LOCATION = "location", 
  PROGRESS = "progress",
  MIRROR = "mirror", // Mirror columns from other boards
  DEPENDENCY = "dependency", // Task dependencies
  FORMULA = "formula", // Auto-calculations
  AUTO_NUMBER = "auto_number",
  CREATION_LOG = "creation_log",
  LAST_UPDATED = "last_updated",
  WORLD_CLOCK = "world_clock",
  WEEK = "week",
  COUNTRY = "country",
  HOUR = "hour",
  COLOR_PICKER = "color_picker",
  VOTE = "vote",
  ITEM_ID = "item_id"
}

// Board columns with all advanced features
export const boardColumns = pgTable("board_columns", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // ColumnType enum
  position: integer("position").default(0),
  width: integer("width").default(120),
  settings: jsonb("settings").default({}), // column-specific settings like colors, options, formulas
  isVisible: boolean("is_visible").default(true),
  isLocked: boolean("is_locked").default(false),
  isFrozen: boolean("is_frozen").default(false),
  description: text("description"),
  // Mirror column settings
  mirrorBoardId: integer("mirror_board_id").references(() => boards.id),
  mirrorColumnId: integer("mirror_column_id"),
  // Formula settings
  formula: text("formula"),
  // Dependency settings
  dependencyType: text("dependency_type"), // blocks, waiting_for, linked_to
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Board items (rows/projects)
export const boardItems = pgTable("board_items", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  name: text("name").notNull(),
  position: integer("position").default(0),
  groupId: integer("group_id").references(() => boardGroups.id),
  createdBy: integer("created_by").references(() => users.id),
  // Auto-calculated fields
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"),
  autoNumber: serial("auto_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Board groups for organizing items
export const boardGroups = pgTable("board_groups", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  name: text("name").notNull(),
  color: text("color").default("#0073ea"),
  position: integer("position").default(0),
  isCollapsed: boolean("is_collapsed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cell values - flexible storage for all column types
export const cellValues = pgTable("cell_values", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => boardItems.id).notNull(),
  columnId: integer("column_id").references(() => boardColumns.id).notNull(),
  value: jsonb("value"), // Stores any type of data
  textValue: text("text_value"), // For quick text searches
  numberValue: decimal("number_value", { precision: 15, scale: 2 }), // For calculations
  dateValue: timestamp("date_value"), // For date operations
  booleanValue: boolean("boolean_value"), // For checkboxes
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subitems for hierarchical structure
export const subItems = pgTable("sub_items", {
  id: serial("id").primaryKey(),
  parentItemId: integer("parent_item_id").references(() => boardItems.id).notNull(),
  name: text("name").notNull(),
  position: integer("position").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subitem cell values
export const subItemCellValues = pgTable("sub_item_cell_values", {
  id: serial("id").primaryKey(),
  subItemId: integer("sub_item_id").references(() => subItems.id).notNull(),
  columnId: integer("column_id").references(() => boardColumns.id).notNull(),
  value: jsonb("value"),
  textValue: text("text_value"),
  numberValue: decimal("number_value", { precision: 15, scale: 2 }),
  dateValue: timestamp("date_value"),
  booleanValue: boolean("boolean_value"),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// File attachments
export const fileAttachments = pgTable("file_attachments", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => boardItems.id),
  subItemId: integer("sub_item_id").references(() => subItems.id),
  columnId: integer("column_id").references(() => boardColumns.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  fileUrl: text("file_url").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Board views (table, kanban, timeline, calendar, etc.)
export const boardViews = pgTable("board_views", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // table, kanban, timeline, calendar, gantt, map, form
  settings: jsonb("settings").default({}), // view-specific settings like filters, sorting, grouping
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Board dependencies
export const itemDependencies = pgTable("item_dependencies", {
  id: serial("id").primaryKey(),
  sourceItemId: integer("source_item_id").references(() => boardItems.id).notNull(),
  targetItemId: integer("target_item_id").references(() => boardItems.id).notNull(),
  dependencyType: text("dependency_type").notNull(), // blocks, waiting_for, linked_to
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Board activity/updates log
export const boardActivities = pgTable("board_activities", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  itemId: integer("item_id").references(() => boardItems.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: text("activity_type").notNull(), // created, updated, deleted, commented, etc.
  description: text("description").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User references for the system (keeping existing users table structure)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  role: text("role").notNull().default("member"), // admin, member, guest
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const boardsRelations = relations(boards, ({ one, many }) => ({
  owner: one(users, { fields: [boards.ownerId], references: [users.id] }),
  workspace: one(workspaces, { fields: [boards.workspaceId], references: [workspaces.id] }),
  columns: many(boardColumns),
  items: many(boardItems),
  groups: many(boardGroups),
  views: many(boardViews),
  activities: many(boardActivities),
}));

export const boardColumnsRelations = relations(boardColumns, ({ one, many }) => ({
  board: one(boards, { fields: [boardColumns.boardId], references: [boards.id] }),
  cellValues: many(cellValues),
  mirrorBoard: one(boards, { fields: [boardColumns.mirrorBoardId], references: [boards.id] }),
  mirrorColumn: one(boardColumns, { fields: [boardColumns.mirrorColumnId], references: [boardColumns.id] }),
}));

export const boardItemsRelations = relations(boardItems, ({ one, many }) => ({
  board: one(boards, { fields: [boardItems.boardId], references: [boards.id] }),
  group: one(boardGroups, { fields: [boardItems.groupId], references: [boardGroups.id] }),
  creator: one(users, { fields: [boardItems.createdBy], references: [users.id] }),
  cellValues: many(cellValues),
  subItems: many(subItems),
  fileAttachments: many(fileAttachments),
  sourceDependencies: many(itemDependencies, { relationName: "sourceDependencies" }),
  targetDependencies: many(itemDependencies, { relationName: "targetDependencies" }),
}));

export const cellValuesRelations = relations(cellValues, ({ one }) => ({
  item: one(boardItems, { fields: [cellValues.itemId], references: [boardItems.id] }),
  column: one(boardColumns, { fields: [cellValues.columnId], references: [boardColumns.id] }),
  updatedByUser: one(users, { fields: [cellValues.updatedBy], references: [users.id] }),
}));

export const subItemsRelations = relations(subItems, ({ one, many }) => ({
  parentItem: one(boardItems, { fields: [subItems.parentItemId], references: [boardItems.id] }),
  creator: one(users, { fields: [subItems.createdBy], references: [users.id] }),
  cellValues: many(subItemCellValues),
  fileAttachments: many(fileAttachments),
}));

export const subItemCellValuesRelations = relations(subItemCellValues, ({ one }) => ({
  subItem: one(subItems, { fields: [subItemCellValues.subItemId], references: [subItems.id] }),
  column: one(boardColumns, { fields: [subItemCellValues.columnId], references: [boardColumns.id] }),
  updatedByUser: one(users, { fields: [subItemCellValues.updatedBy], references: [users.id] }),
}));

// Zod schemas for validation
export const createBoardSchema = createInsertSchema(boards).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const createBoardItemSchema = createInsertSchema(boardItems).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  autoNumber: true,
  progress: true 
});

export const createBoardColumnSchema = createInsertSchema(boardColumns).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateCellValueSchema = createInsertSchema(cellValues).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Type exports
export type Board = typeof boards.$inferSelect;
export type BoardInsert = z.infer<typeof createBoardSchema>;
export type BoardItem = typeof boardItems.$inferSelect;
export type BoardItemInsert = z.infer<typeof createBoardItemSchema>;
export type BoardColumn = typeof boardColumns.$inferSelect;
export type BoardColumnInsert = z.infer<typeof createBoardColumnSchema>;
export type CellValue = typeof cellValues.$inferSelect;
export type CellValueUpdate = z.infer<typeof updateCellValueSchema>;
export type SubItem = typeof subItems.$inferSelect;
export type BoardView = typeof boardViews.$inferSelect;
export type BoardActivity = typeof boardActivities.$inferSelect;