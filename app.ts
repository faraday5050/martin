import express from "express";
import { sql } from "@vercel/postgres";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Parser } from "json2csv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === '1' || !!process.env.POSTGRES_URL;
const JWT_SECRET = process.env.JWT_SECRET || "quench-mart-secret-key-2024";

// Database Abstraction Layer
const query = async (text: string, params: any[] = []) => {
  if (isVercel && process.env.POSTGRES_URL) {
    // Postgres (Vercel)
    const result = await sql.query(text.replace(/\?/g, (_, i) => `$${i + 1}`), params);
    return {
      rows: result.rows,
      lastInsertRowid: (result as any).rows?.[0]?.id || null
    };
  } else {
    // SQLite (Local) - Dynamic import to avoid issues on Vercel
    const { default: Database } = await import("better-sqlite3");
    const dbPath = path.join(__dirname, "quench_mart.db");
    const localDb = new Database(dbPath);
    try {
      if (text.trim().toUpperCase().startsWith("SELECT")) {
        const rows = localDb.prepare(text).all(...params);
        return { rows, lastInsertRowid: null };
      } else {
        const result = localDb.prepare(text).run(...params);
        return { rows: [], lastInsertRowid: result.lastInsertRowid };
      }
    } finally {
      localDb.close();
    }
  }
};

const exec = async (text: string) => {
  if (isVercel && process.env.POSTGRES_URL) {
    const statements = text.split(';').filter(s => s.trim());
    for (const s of statements) {
      await sql.query(s);
    }
  } else {
    const { default: Database } = await import("better-sqlite3");
    const dbPath = path.join(__dirname, "quench_mart.db");
    const localDb = new Database(dbPath);
    localDb.exec(text);
    localDb.close();
  }
};

// Initialize database
async function initDb() {
  const idType = isVercel ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  const realType = isVercel ? "DECIMAL(10,2)" : "REAL";
  const timestampDefault = isVercel ? "CURRENT_TIMESTAMP" : "CURRENT_TIMESTAMP";

  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id ${idType},
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'employee'
    );

    CREATE TABLE IF NOT EXISTS products (
      id ${idType},
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      retail_price ${realType} NOT NULL,
      wholesale_price ${realType} NOT NULL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      unit_type TEXT DEFAULT 'units',
      items_per_pack INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sales (
      id ${idType},
      product_id INTEGER,
      amount ${realType} NOT NULL,
      quantity INTEGER DEFAULT 1,
      description TEXT,
      timestamp TIMESTAMP DEFAULT ${timestampDefault},
      user_id INTEGER,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id ${idType},
      amount ${realType} NOT NULL,
      description TEXT,
      category TEXT,
      timestamp TIMESTAMP DEFAULT ${timestampDefault},
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Migration for products table
  try {
    const { rows: columns } = await query(
      isVercel 
        ? "SELECT column_name as name FROM information_schema.columns WHERE table_name = 'products'"
        : "PRAGMA table_info(products)"
    );
    const columnNames = columns.map((c: any) => c.name.toLowerCase());

    if (!columnNames.includes('retail_price')) {
      if (columnNames.includes('price')) {
        await exec("ALTER TABLE products RENAME COLUMN price TO retail_price");
      } else {
        await exec(`ALTER TABLE products ADD COLUMN retail_price ${realType} NOT NULL DEFAULT 0`);
      }
    }
    if (!columnNames.includes('wholesale_price')) {
      await exec(`ALTER TABLE products ADD COLUMN wholesale_price ${realType} NOT NULL DEFAULT 0`);
    }
    if (!columnNames.includes('unit_type')) {
      await exec("ALTER TABLE products ADD COLUMN unit_type TEXT DEFAULT 'units'");
    }
    if (!columnNames.includes('items_per_pack')) {
      await exec("ALTER TABLE products ADD COLUMN items_per_pack INTEGER DEFAULT 1");
    }
  } catch (e) {
    console.error("Migration error:", e);
  }

  // Seed default admin
  const { rows: admins } = await query("SELECT * FROM users WHERE username = ?", ["admin"]);
  if (admins.length === 0) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    await query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", hashedPassword, "admin"]);
  }
}

initDb().catch(console.error);

const app = express();
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(), 
    env: process.env.NODE_ENV, 
    isVercel,
    dbType: process.env.POSTGRES_URL ? 'Postgres' : 'SQLite'
  });
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
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const { rows } = await query("SELECT * FROM users WHERE username = ?", [username]);
  const user = rows[0];

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
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
});

// Product Routes
app.get("/api/products", authenticateToken, async (req, res) => {
  const { rows } = await query("SELECT * FROM products");
  res.json(rows);
});

const checkSecurityKey = (req: any, res: any, next: any) => {
  const securityKey = req.headers['x-inventory-key'];
  const masterKey = process.env.INVENTORY_SECURITY_KEY || "quench-vault-2026";
  
  if (securityKey !== masterKey) {
    return res.status(403).json({ error: "Invalid inventory security key" });
  }
  next();
};

app.post("/api/products", authenticateToken, checkSecurityKey, async (req, res) => {
  const { name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack } = req.body;
  const { lastInsertRowid } = await query(
    "INSERT INTO products (name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
    [name, category, sub_category, retail_price, wholesale_price || 0, stock || 0, unit_type || 'units', items_per_pack || 1]
  );
  res.json({ id: lastInsertRowid });
});

app.put("/api/products/:id", authenticateToken, checkSecurityKey, async (req, res) => {
  const { name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack } = req.body;
  await query(
    "UPDATE products SET name = ?, category = ?, sub_category = ?, retail_price = ?, wholesale_price = ?, stock = ?, unit_type = ?, items_per_pack = ? WHERE id = ?",
    [name, category, sub_category, retail_price, wholesale_price, stock, unit_type, items_per_pack, req.params.id]
  );
  res.json({ success: true });
});

app.delete("/api/products/:id", authenticateToken, checkSecurityKey, async (req, res) => {
  await query("DELETE FROM products WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// Sales Routes
app.get("/api/sales", authenticateToken, async (req, res) => {
  const { rows } = await query(`
    SELECT s.*, p.name as product_name, u.username 
    FROM sales s 
    LEFT JOIN products p ON s.product_id = p.id 
    LEFT JOIN users u ON s.user_id = u.id 
    ORDER BY s.timestamp DESC
  `);
  res.json(rows);
});

app.post("/api/sales", authenticateToken, async (req: any, res) => {
  const { product_id, amount, quantity, description, date } = req.body;
  const { lastInsertRowid } = await query(
    "INSERT INTO sales (product_id, amount, quantity, description, timestamp, user_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
    [product_id || null, amount, quantity || 1, description || "", date || new Date().toISOString(), req.user.id]
  );
  
  if (product_id) {
    await query("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity || 1, product_id]);
  }
  
  res.json({ id: lastInsertRowid });
});

// Expense Routes
app.get("/api/expenses", authenticateToken, async (req, res) => {
  const { rows } = await query("SELECT e.*, u.username FROM expenses e LEFT JOIN users u ON e.user_id = u.id ORDER BY e.timestamp DESC");
  res.json(rows);
});

app.post("/api/expenses", authenticateToken, async (req: any, res) => {
  const { amount, description, category, date } = req.body;
  const { lastInsertRowid } = await query(
    "INSERT INTO expenses (amount, description, category, timestamp, user_id) VALUES (?, ?, ?, ?, ?) RETURNING id",
    [amount, description || "", category || "General", date || new Date().toISOString(), req.user.id]
  );
  res.json({ id: lastInsertRowid });
});

// Report Export
app.get("/api/reports/sales/csv", authenticateToken, async (req, res) => {
  const { rows: sales } = await query(`
    SELECT s.timestamp, p.name as product, s.amount, s.quantity, s.description, u.username 
    FROM sales s 
    LEFT JOIN products p ON s.product_id = p.id 
    LEFT JOIN users u ON s.user_id = u.id 
    ORDER BY s.timestamp DESC
  `);
  
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

export default app;
