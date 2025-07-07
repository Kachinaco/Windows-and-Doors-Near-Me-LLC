import { Express } from "express";
import { storage } from "./storage-simple";

// In-memory storage for boards and items
const boards = new Map();
const boardItems = new Map();

// Initialize some sample data
boards.set(1, { id: 1, name: "Main Board", description: "Window Installation Projects" });
boards.set(2, { id: 2, name: "Marketing Board", description: "Marketing and Sales" });
boards.set(3, { id: 3, name: "Admin Board", description: "Administrative Tasks" });

export function setupRoutes(app: Express): void {
  // Board routes
  app.get("/api/boards/:boardId/items", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const items = boardItems.get(boardId) || [];
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch board items" });
    }
  });

  app.post("/api/boards/:boardId/items", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const { item } = req.body;
      
      const items = boardItems.get(boardId) || [];
      const newItem = {
        id: Date.now(), // Simple ID generation
        boardId,
        ...item,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      items.push(newItem);
      boardItems.set(boardId, items);
      
      res.json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to create board item" });
    }
  });

  app.put("/api/boards/:boardId/items/:itemId", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const itemId = parseInt(req.params.itemId);
      const { values } = req.body;
      
      const items = boardItems.get(boardId) || [];
      const itemIndex = items.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      items[itemIndex] = {
        ...items[itemIndex],
        values: { ...items[itemIndex].values, ...values },
        updated_at: new Date()
      };
      
      boardItems.set(boardId, items);
      res.json(items[itemIndex]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update board item" });
    }
  });

  app.delete("/api/boards/:boardId/items/:itemId", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const itemId = parseInt(req.params.itemId);
      
      const items = boardItems.get(boardId) || [];
      const filteredItems = items.filter(item => item.id !== itemId);
      
      boardItems.set(boardId, filteredItems);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board item" });
    }
  });

  // Simple auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      // Simple mock authentication
      if (username && password) {
        res.json({ 
          success: true, 
          token: "mock-token", 
          user: { id: 1, username, role: "admin" } 
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      // Mock user data
      res.json({ 
        id: 1, 
        username: "admin", 
        role: "admin",
        first_name: "Admin",
        last_name: "User"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}