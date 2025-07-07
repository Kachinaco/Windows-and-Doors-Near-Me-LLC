import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure neon to use the ws library
neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize database with required tables
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Create boards table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create board_items table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS board_items (
        id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        group_name VARCHAR(255) DEFAULT 'Main Group',
        "order" INTEGER DEFAULT 0,
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert some default boards if they don't exist
    const { rows } = await client.query("SELECT COUNT(*) FROM boards");
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO boards (id, name, description, created_by) VALUES 
        (1, 'Main Board', 'Window Installation Projects', 1),
        (2, 'Marketing Board', 'Marketing and Sales', 1),
        (3, 'Admin Board', 'Administrative Tasks', 1)
        ON CONFLICT (id) DO NOTHING
      `);
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    client.release();
  }
}

// Database helper functions
export async function queryDatabase(query: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function insertAndReturn(query: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}