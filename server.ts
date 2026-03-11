import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Parser } from "json2csv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "quench_mart.db");
console.log(`Initializing database at: ${dbPath}`);
const db = new Database(dbPath);
const JWT_SECRET = process.env.JWT_SECRET || "quench-mart-secret-key-2024";

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'employee'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    retail_price REAL NOT NULL,
    wholesale_price REAL NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    unit_type TEXT DEFAULT 'units',
    items_per_pack INTEGER DEFAULT 1
  );
`);

// Migration: Add columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(products)").all() as any[];
const columns = tableInfo.map(c => c.name);

if (!columns.includes('retail_price')) {
  // If retail_price is missing, we might be coming from an old schema with 'price'
  if (columns.includes('price')) {
    db.exec("ALTER TABLE products RENAME COLUMN price TO retail_price");
  } else {
    db.exec("ALTER TABLE products ADD COLUMN retail_price REAL NOT NULL DEFAULT 0");
  }
}
if (!columns.includes('wholesale_price')) {
  db.exec("ALTER TABLE products ADD COLUMN wholesale_price REAL NOT NULL DEFAULT 0");
}
if (!columns.includes('unit_type')) {
  db.exec("ALTER TABLE products ADD COLUMN unit_type TEXT DEFAULT 'units'");
}
if (!columns.includes('items_per_pack')) {
  db.exec("ALTER TABLE products ADD COLUMN items_per_pack INTEGER DEFAULT 1");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    amount REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT,
    category TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed default admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", hashedPassword, "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

    if (user && bcrypt.compareSync(currentPassword, user.password)) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.user.id);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid current password" });
    }
  });

  // Product Routes
  app.get("/api/products", authenticateToken, (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  const checkSecurityKey = (req: any, res: any, next: any) => {
    const securityKey = req.headers['x-inventory-key'];
    const masterKey = process.env.INVENTORY_SECURITY_KEY || "quench-vault-2026";
    
    if (securityKey !== masterKey) {
      return res.status(403).json({ error: "Invalid inventory security key" });
    }
    next();
  };

  app.post("/api/products", authenticateToken, checkSecurityKey, (req, res) => {
    const { name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack } = req.body;
    const stmt = db.prepare("INSERT INTO products (name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const info = stmt.run(name, category, sub_category, retail_price, wholesale_price || 0, stock || 0, unit_type || 'units', items_per_pack || 1);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", authenticateToken, checkSecurityKey, (req, res) => {
    const { name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack } = req.body;
    db.prepare("UPDATE products SET name = ?, category = ?, sub_category = ?, retail_price = ?, wholesale_price = ?, stock = ?, unit_type = ?, items_per_pack = ? WHERE id = ?")
      .run(name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", authenticateToken, checkSecurityKey, (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Sales Routes
  app.get("/api/sales", authenticateToken, (req, res) => {
    const sales = db.prepare(`
      SELECT s.*, p.name as product_name, u.username 
      FROM sales s 
      LEFT JOIN products p ON s.product_id = p.id 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.timestamp DESC
    `).all();
    res.json(sales);
  });

  app.post("/api/sales", authenticateToken, (req: any, res) => {
    const { product_id, amount, quantity, description, date } = req.body;
    const stmt = db.prepare("INSERT INTO sales (product_id, amount, quantity, description, timestamp, user_id) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(product_id || null, amount, quantity || 1, description || "", date || new Date().toISOString(), req.user.id);
    
    // Update stock if product_id is provided
    if (product_id) {
      db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(quantity || 1, product_id);
    }
    
    res.json({ id: info.lastInsertRowid });
  });

  // Expense Routes
  app.get("/api/expenses", authenticateToken, (req, res) => {
    const expenses = db.prepare("SELECT e.*, u.username FROM expenses e LEFT JOIN users u ON e.user_id = u.id ORDER BY e.timestamp DESC").all();
    res.json(expenses);
  });

  app.post("/api/expenses", authenticateToken, (req: any, res) => {
    const { amount, description, category, date } = req.body;
    const stmt = db.prepare("INSERT INTO expenses (amount, description, category, timestamp, user_id) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(amount, description || "", category || "General", date || new Date().toISOString(), req.user.id);
    res.json({ id: info.lastInsertRowid });
  });

  // Report Export
  app.get("/api/reports/sales/csv", authenticateToken, (req, res) => {
    const sales = db.prepare(`
      SELECT s.timestamp, p.name as product, s.amount, s.quantity, s.description, u.username 
      FROM sales s 
      LEFT JOIN products p ON s.product_id = p.id 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.timestamp DESC
    `).all();
    
    try {
      const parser = new Parser();
      const csv = parser.parse(sales);
      res.header('Content-Type', 'text/csv');
      res.attachment('sales_report.csv');
      res.send(csv);
    } catch (err) {
      res.status(500).send("Error generating CSV");
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Quench Mart Server running on http://0.0.0.0:${PORT}`);
    console.log(`Database initialized at quench_mart.db`);
  });
}

startServer();
