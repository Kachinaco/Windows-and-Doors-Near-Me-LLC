#!/usr/bin/env tsx

import { db } from "./db";
import { boards, boardColumns, boardItems, boardItemValues } from "@shared/schema";
import { seedBoardData } from "./seed-data";

async function setupCleanBoards() {
  try {
    console.log("🧹 Cleaning existing board data...");
    
    // Clear existing data in correct order (respecting foreign keys)
    await db.delete(boardItemValues);
    await db.delete(boardItems);
    await db.delete(boardColumns);
    
    console.log("✓ Cleared existing board data");

    // Ensure main board exists
    const existingBoards = await db.select().from(boards).limit(1);
    if (existingBoards.length === 0) {
      await db.insert(boards).values({
        name: "Main Board",
        admin_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log("✓ Created main board");
    }

    // Seed fresh data
    await seedBoardData();
    
    console.log("🎉 Clean board setup complete!");
    
  } catch (error) {
    console.error("❌ Error setting up clean boards:", error);
    process.exit(1);
  }
}

setupCleanBoards();