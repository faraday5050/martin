import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Parser } from "json2csv";
import { query, initDb } from "./db.js";
import { authenticateToken, checkSecurityKey } from "./middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "quench-mart-secret-key-2024";

const app = express();
app.use(express.json());

// Initialize database on startup
initDb().then(async () => {
  console.log("Database initialized successfully");
  // Seed default admin
  const { rows: admins } = await query("SELECT * FROM users WHERE username = ?", ["admin"]);
  if (admins.length === 0) {
    console.log("Seeding default admin user...");
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    await query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", hashedPassword, "admin"]);
    console.log("Admin user seeded successfully");
  } else {
    console.log("Admin user already exists");
  }
}).catch(err => {
  console.error("Database initialization failed:", err);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(), 
    isVercel: process.env.VERCEL === '1'
  });
});

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt for:", username);
    const { rows } = await query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];

    if (user) {
      console.log("User found, comparing passwords...");
      if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
      } else {
        console.log("Invalid password for user:", username);
        res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      console.log("User not found:", username);
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];

    if (user && bcrypt.compareSync(currentPassword, user.password)) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid current password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Product Routes
app.get("/api/products", authenticateToken, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM products");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/products", authenticateToken, checkSecurityKey, async (req, res) => {
  try {
    const { name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack } = req.body;
    const { lastInsertRowid } = await query(
      "INSERT INTO products (name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
      [name, category, sub_category, retail_price, wholesale_price || 0, stock || 0, unit_type || 'units', items_per_pack || 1]
    );
    res.json({ id: lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/products/:id", authenticateToken, checkSecurityKey, async (req, res) => {
  try {
    const { name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack } = req.body;
    await query(
      "UPDATE products SET name = ?, category = ?, sub_category = ?, retail_price = ?, wholesale_price = ?, stock = ?, unit_type = ?, items_per_pack = ? WHERE id = ?",
      [name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/products/:id", authenticateToken, checkSecurityKey, async (req, res) => {
  try {
    await query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sales Routes
app.get("/api/sales", authenticateToken, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT s.*, p.name as product_name, u.username 
      FROM sales s 
      LEFT JOIN products p ON s.product_id = p.id 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.timestamp DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/sales", authenticateToken, async (req: any, res) => {
  try {
    const { product_id, amount, quantity, description, date } = req.body;
    const { lastInsertRowid } = await query(
      "INSERT INTO sales (product_id, amount, quantity, description, timestamp, user_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
      [product_id || null, amount, quantity || 1, description || "", date || new Date().toISOString(), req.user.id]
    );
    
    if (product_id) {
      await query("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity || 1, product_id]);
    }
    
    res.json({ id: lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Expense Routes
app.get("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const { rows } = await query("SELECT e.*, u.username FROM expenses e LEFT JOIN users u ON e.user_id = u.id ORDER BY e.timestamp DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/expenses", authenticateToken, async (req: any, res) => {
  try {
    const { amount, description, category, date } = req.body;
    const { lastInsertRowid } = await query(
      "INSERT INTO expenses (amount, description, category, timestamp, user_id) VALUES (?, ?, ?, ?, ?) RETURNING id",
      [amount, description || "", category || "General", date || new Date().toISOString(), req.user.id]
    );
    res.json({ id: lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Report Export
app.get("/api/reports/sales/csv", authenticateToken, async (req, res) => {
  try {
    const { rows: sales } = await query(`
      SELECT s.timestamp, p.name as product, s.amount, s.quantity, s.description, u.username 
      FROM sales s 
      LEFT JOIN products p ON s.product_id = p.id 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.timestamp DESC
    `);
    
    const parser = new Parser();
    const csv = parser.parse(sales);
    res.header('Content-Type', 'text/csv');
    res.attachment('sales_report.csv');
    res.send(csv);
  } catch (err) {
    console.error("CSV Export error:", err);
    res.status(500).send("Error generating CSV");
  }
});

export default app;
