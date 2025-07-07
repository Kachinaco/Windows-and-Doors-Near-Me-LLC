import type { Express } from "express";
import { storage } from "./storage";

// API routes for multi-tenant board system
export function registerBoardRoutes(app: Express) {
  
  // Get board data for current admin account
  app.get("/api/boards/:boardId/data", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get admin ID (if user is admin, use their ID, if employee use their admin_id)
      const adminId = user.admin_id || user.id;
      
      // Get board items for this admin's account
      const items = await storage.getBoardItemsForAdmin(boardId, adminId);
      const columns = await storage.getBoardColumns(boardId);
      
      // Get item values for each item
      const itemsWithValues = await Promise.all(
        items.map(async (item) => {
          const values = await storage.getBoardItemValues(item.id);
          const valuesMap = values.reduce((acc, val) => {
            acc[val.column_id] = val.value;
            return acc;
          }, {} as any);
          
          return {
            ...item,
            values: valuesMap,
          };
        })
      );
      
      res.json({
        items: itemsWithValues,
        columns,
      });
    } catch (error) {
      console.error("Error fetching board data:", error);
      res.status(500).json({ error: "Failed to fetch board data" });
    }
  });
  
  // Create new board item for admin account
  app.post("/api/boards/:boardId/items", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const { groupName } = req.body;
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const adminId = user.admin_id || user.id;
      
      const newItem = await storage.createBoardItemForAdmin(boardId, groupName || "Main Group", adminId);
      
      res.json(newItem);
    } catch (error) {
      console.error("Error creating board item:", error);
      res.status(500).json({ error: "Failed to create board item" });
    }
  });
  
  // Update board item value for admin account
  app.post("/api/boards/items/:itemId/values", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const { columnId, value } = req.body;
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const adminId = user.admin_id || user.id;
      
      await storage.setBoardItemValueForAdmin(itemId, parseInt(columnId), value, adminId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating board item value:", error);
      res.status(500).json({ error: "Failed to update board item value" });
    }
  });
}