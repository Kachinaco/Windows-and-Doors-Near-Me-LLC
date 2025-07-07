import { Express } from "express";
import { queryDatabase, insertAndReturn } from "./database-setup";

export function setupRoutes(app: Express): void {
  // Board routes
  app.get("/api/boards/:boardId/items", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const items = await queryDatabase(
        "SELECT * FROM board_items WHERE board_id = $1 ORDER BY \"order\", id",
        [boardId]
      );
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch board items:", error);
      res.status(500).json({ error: "Failed to fetch board items" });
    }
  });

  app.post("/api/boards/:boardId/items", async (req, res) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const { item } = req.body;
      
      const newItem = await insertAndReturn(
        `INSERT INTO board_items (board_id, group_name, "order") 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [boardId, item?.group_name || "Main Group", item?.order || 0]
      );
      
      res.json(newItem);
    } catch (error) {
      console.error("Failed to create board item:", error);
      res.status(500).json({ error: "Failed to create board item" });
    }
  });

  app.delete("/api/boards/:boardId/items/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      await queryDatabase(
        "DELETE FROM board_items WHERE id = $1",
        [itemId]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete board item:", error);
      res.status(500).json({ error: "Failed to delete board item" });
    }
  });

  // Project routes (boards)
  app.get("/api/projects", async (req, res) => {
    try {
      const projectList = await queryDatabase("SELECT * FROM boards ORDER BY created_at DESC");
      res.json(projectList);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, description } = req.body;
      const newBoard = await insertAndReturn(
        "INSERT INTO boards (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
        [name, description || "", 1]
      );
      
      res.json(newBoard);
    } catch (error) {
      console.error("Failed to create project:", error);
      res.status(500).json({ error: "Failed to create project" });
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