import {
  users,
  boards,
  boardColumns,
  boardItems,
  boardItemValues,
  boardFolders,
  boardSubItems,
  boardSubItemValues,
  projects, // alias for boards
  type User,
  type InsertUser,
  type Board,
  type InsertBoard,
  type BoardColumn,
  type InsertBoardColumn,
  type BoardItem,
  type InsertBoardItem,
  type BoardItemValue,
  type InsertBoardItemValue,
  type BoardFolder,
  type InsertBoardFolder,
  type BoardSubItem,
  type InsertBoardSubItem,
  type BoardSubItemValue,
  type InsertBoardSubItemValue,
  type Project,
  type InsertProject,
} from '@shared/schema';
import { db } from './db';
import { eq, desc, asc, and, or, like, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Storage interface for board-based project management
export interface IStorage {
  // User management
  getUserByUsername(username: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | null>;
  
  // Board/Project management
  getBoards(): Promise<Board[]>;
  getBoardById(id: number): Promise<Board | null>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: number, updates: Partial<InsertBoard>): Promise<Board | null>;
  deleteBoard(id: number): Promise<boolean>;
  
  // Board columns
  getBoardColumns(boardId: number): Promise<BoardColumn[]>;
  createBoardColumn(column: InsertBoardColumn): Promise<BoardColumn>;
  updateBoardColumn(id: number, updates: Partial<InsertBoardColumn>): Promise<BoardColumn | null>;
  deleteBoardColumn(id: number): Promise<boolean>;
  
  // Board items
  getBoardItems(boardId: number): Promise<BoardItem[]>;
  getBoardItemById(id: number): Promise<BoardItem | null>;
  createBoardItem(item: InsertBoardItem): Promise<BoardItem>;
  updateBoardItem(id: number, updates: Partial<InsertBoardItem>): Promise<BoardItem | null>;
  deleteBoardItem(id: number): Promise<boolean>;
  
  // Board item values
  getBoardItemValues(itemId: number): Promise<BoardItemValue[]>;
  getBoardItemValue(itemId: number, columnId: number): Promise<BoardItemValue | null>;
  setBoardItemValue(value: InsertBoardItemValue): Promise<BoardItemValue>;
  
  // Board folders
  getBoardFolders(itemId: number): Promise<BoardFolder[]>;
  createBoardFolder(folder: InsertBoardFolder): Promise<BoardFolder>;
  updateBoardFolder(id: number, updates: Partial<InsertBoardFolder>): Promise<BoardFolder | null>;
  deleteBoardFolder(id: number): Promise<boolean>;
  
  // Board sub-items
  getBoardSubItems(folderId: number): Promise<BoardSubItem[]>;
  createBoardSubItem(subItem: InsertBoardSubItem): Promise<BoardSubItem>;
  updateBoardSubItem(id: number, updates: Partial<InsertBoardSubItem>): Promise<BoardSubItem | null>;
  deleteBoardSubItem(id: number): Promise<boolean>;
  
  // Board sub-item values
  getBoardSubItemValues(subItemId: number): Promise<BoardSubItemValue[]>;
  setBoardSubItemValue(value: InsertBoardSubItemValue): Promise<BoardSubItemValue>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User management
  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async createUser(user: InsertUser & { password: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const { password, ...userData } = user;
    
    const result = await db.insert(users).values({
      ...userData,
      password_hash: hashedPassword,
    }).returning();
    
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | null> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return result[0] || null;
  }

  // Board/Project management with admin ownership
  async getBoards(): Promise<Board[]> {
    return await db.select().from(boards).orderBy(desc(boards.created_at));
  }

  async getBoardsByAdminId(adminId: number): Promise<Board[]> {
    return await db.select().from(boards).where(eq(boards.admin_id, adminId)).orderBy(desc(boards.created_at));
  }

  async getBoardById(id: number): Promise<Board | null> {
    const result = await db.select().from(boards).where(eq(boards.id, id)).limit(1);
    return result[0] || null;
  }

  async createBoard(board: InsertBoard & { admin_id: number }): Promise<Board> {
    const result = await db.insert(boards).values(board).returning();
    return result[0];
  }

  async updateBoard(id: number, updates: Partial<InsertBoard>): Promise<Board | null> {
    const result = await db.update(boards)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(boards.id, id))
      .returning();
    
    return result[0] || null;
  }

  async deleteBoard(id: number): Promise<boolean> {
    const result = await db.delete(boards).where(eq(boards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Board columns
  async getBoardColumns(boardId: number): Promise<BoardColumn[]> {
    const result = await db.select().from(boardColumns)
      .where(eq(boardColumns.board_id, boardId))
      .orderBy(asc(boardColumns.order));
    return result as BoardColumn[];
  }

  async createBoardColumn(column: InsertBoardColumn): Promise<BoardColumn> {
    const result = await db.insert(boardColumns).values(column).returning();
    return result[0] as BoardColumn;
  }

  async updateBoardColumn(id: number, updates: Partial<InsertBoardColumn>): Promise<BoardColumn | null> {
    const result = await db.update(boardColumns)
      .set(updates)
      .where(eq(boardColumns.id, id))
      .returning();
    
    return (result[0] as BoardColumn) || null;
  }

  async deleteBoardColumn(id: number): Promise<boolean> {
    const result = await db.delete(boardColumns).where(eq(boardColumns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Board items with admin verification
  async getBoardItems(boardId: number): Promise<BoardItem[]> {
    return await db.select().from(boardItems)
      .where(eq(boardItems.board_id, boardId))
      .orderBy(asc(boardItems.order));
  }

  async getBoardItemsForAdmin(boardId: number, adminId: number): Promise<BoardItem[]> {
    // First verify the board belongs to the admin
    const boardResult = await db.select().from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.admin_id, adminId)))
      .limit(1);
    
    if (!boardResult.length) return [];
    
    return await db.select().from(boardItems)
      .where(eq(boardItems.board_id, boardId))
      .orderBy(asc(boardItems.order));
  }

  async getBoardItemById(id: number): Promise<BoardItem | null> {
    const result = await db.select().from(boardItems).where(eq(boardItems.id, id)).limit(1);
    return result[0] || null;
  }

  async createBoardItem(item: InsertBoardItem): Promise<BoardItem> {
    const result = await db.insert(boardItems).values(item).returning();
    return result[0];
  }

  async updateBoardItem(id: number, updates: Partial<InsertBoardItem>): Promise<BoardItem | null> {
    const result = await db.update(boardItems)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(boardItems.id, id))
      .returning();
    
    return result[0] || null;
  }

  async deleteBoardItem(id: number): Promise<boolean> {
    const result = await db.delete(boardItems).where(eq(boardItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Board item values
  async getBoardItemValues(itemId: number): Promise<BoardItemValue[]> {
    return await db.select().from(boardItemValues)
      .where(eq(boardItemValues.item_id, itemId));
  }

  async getBoardItemValue(itemId: number, columnId: number): Promise<BoardItemValue | null> {
    const result = await db.select().from(boardItemValues)
      .where(and(
        eq(boardItemValues.item_id, itemId),
        eq(boardItemValues.column_id, columnId)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async setBoardItemValue(value: InsertBoardItemValue): Promise<BoardItemValue> {
    // Try to update existing value first
    const existing = await this.getBoardItemValue(value.item_id!, value.column_id!);
    
    if (existing) {
      const result = await db.update(boardItemValues)
        .set({ value: value.value, updated_at: new Date() })
        .where(eq(boardItemValues.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(boardItemValues).values(value).returning();
      return result[0];
    }
  }

  // Admin-based board item value operations
  async setBoardItemValueForAdmin(itemId: number, columnId: number, value: string, adminId: number): Promise<void> {
    // First verify the item belongs to a board owned by the admin
    const itemResult = await db.select()
      .from(boardItems)
      .innerJoin(boards, eq(boardItems.board_id, boards.id))
      .where(and(eq(boardItems.id, itemId), eq(boards.admin_id, adminId)))
      .limit(1);
    
    if (!itemResult.length) {
      throw new Error('Item not found or access denied');
    }
    
    // Try to update existing value first
    const existing = await this.getBoardItemValue(itemId, columnId);
    
    if (existing) {
      await db.update(boardItemValues)
        .set({ value, updated_at: new Date() })
        .where(eq(boardItemValues.id, existing.id));
    } else {
      await db.insert(boardItemValues).values({
        item_id: itemId,
        column_id: columnId,
        value,
      });
    }
  }

  async createBoardItemForAdmin(boardId: number, groupName: string, adminId: number): Promise<BoardItem> {
    // First verify the board belongs to the admin
    const boardResult = await db.select().from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.admin_id, adminId)))
      .limit(1);
    
    if (!boardResult.length) {
      throw new Error('Board not found or access denied');
    }
    
    const result = await db.insert(boardItems).values({
      board_id: boardId,
      group_name: groupName,
      order: 0,
    }).returning();
    
    return result[0];
  }

  // Board folders
  async getBoardFolders(itemId: number): Promise<BoardFolder[]> {
    return await db.select().from(boardFolders)
      .where(eq(boardFolders.item_id, itemId))
      .orderBy(asc(boardFolders.order));
  }

  async createBoardFolder(folder: InsertBoardFolder): Promise<BoardFolder> {
    const result = await db.insert(boardFolders).values(folder).returning();
    return result[0];
  }

  async updateBoardFolder(id: number, updates: Partial<InsertBoardFolder>): Promise<BoardFolder | null> {
    const result = await db.update(boardFolders)
      .set(updates)
      .where(eq(boardFolders.id, id))
      .returning();
    
    return result[0] || null;
  }

  async deleteBoardFolder(id: number): Promise<boolean> {
    const result = await db.delete(boardFolders).where(eq(boardFolders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Board sub-items
  async getBoardSubItems(folderId: number): Promise<BoardSubItem[]> {
    return await db.select().from(boardSubItems)
      .where(eq(boardSubItems.folder_id, folderId))
      .orderBy(asc(boardSubItems.order));
  }

  async createBoardSubItem(subItem: InsertBoardSubItem): Promise<BoardSubItem> {
    const result = await db.insert(boardSubItems).values(subItem).returning();
    return result[0];
  }

  async updateBoardSubItem(id: number, updates: Partial<InsertBoardSubItem>): Promise<BoardSubItem | null> {
    const result = await db.update(boardSubItems)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(boardSubItems.id, id))
      .returning();
    
    return result[0] || null;
  }

  async deleteBoardSubItem(id: number): Promise<boolean> {
    const result = await db.delete(boardSubItems).where(eq(boardSubItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Board sub-item values
  async getBoardSubItemValues(subItemId: number): Promise<BoardSubItemValue[]> {
    return await db.select().from(boardSubItemValues)
      .where(eq(boardSubItemValues.sub_item_id, subItemId));
  }

  async setBoardSubItemValue(value: InsertBoardSubItemValue): Promise<BoardSubItemValue> {
    // Check if value exists
    const existing = await db.select().from(boardSubItemValues)
      .where(and(
        eq(boardSubItemValues.sub_item_id, value.sub_item_id!),
        eq(boardSubItemValues.column_id, value.column_id!)
      ))
      .limit(1);
    
    if (existing[0]) {
      const result = await db.update(boardSubItemValues)
        .set({ value: value.value, updated_at: new Date() })
        .where(eq(boardSubItemValues.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(boardSubItemValues).values(value).returning();
      return result[0];
    }
  }
}

// Create storage instance
export const storage = new DatabaseStorage();