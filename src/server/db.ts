import { sql } from "@vercel/postgres";
import path from "path";

const hasPostgres = True;


export interface QueryResult {
  rows: any[];
  lastInsertRowid: number | string | null;
}

let sqliteDb: any = null;



export const query = async (text: string, params: any[] = []): Promise<QueryResult> => {
  if (isVercel && hasPostgres) {
    // Vercel Postgres
    // Replace ? with $1, $2, etc. correctly using a counter
    let count = 0;
    const pgText = text.replace(/\?/g, () => `$${++count}`);
    
    try {
      const result = await sql.query(pgText, params);
      // For INSERTs, we try to get the ID from the first row if RETURNING was used
      const lastInsertRowid = (result as any).rows?.[0]?.id || null;
      
      return {
        rows: result.rows,
        lastInsertRowid
      };
    } catch (error) {
      console.error("Postgres query error:", error, "Query:", pgText, "Params:", params);
      throw error;
    }
  } else {
    // Local SQLite
    const localDb = await getSqliteDb();
    
    try {
      if (text.trim().toUpperCase().startsWith("SELECT") || text.trim().toUpperCase().startsWith("PRAGMA")) {
        const rows = localDb.prepare(text).all(...params);
        return { rows, lastInsertRowid: null };
      } else {
        // Handle queries with RETURNING clause
        if (text.toUpperCase().includes("RETURNING")) {
          const rows = localDb.prepare(text).all(...params);
          const lastInsertRowid = rows[0]?.id || null;
          return { rows, lastInsertRowid };
        }
        const result = localDb.prepare(text).run(...params);
        return { rows: [], lastInsertRowid: result.lastInsertRowid };
      }
    } catch (error) {
      console.error("SQLite query error:", error, "Query:", text, "Params:", params);
      throw error;
    }
  }
};

export const exec = async (text: string): Promise<void> => {
  if (isVercel && hasPostgres) {
    const statements = text.split(';').filter(s => s.trim());
    for (const s of statements) {
      await sql.query(s);
    }
  } else {
    const localDb = await getSqliteDb();
    try {
      localDb.exec(text);
    } catch (error) {
      console.error("SQLite exec error:", error, "SQL:", text);
      throw error;
    }
  }
};

export const initDb = async () => {
  const usePostgres = isVercel && hasPostgres;
  const idType = usePostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  const realType = usePostgres ? "DECIMAL(10,2)" : "REAL";
  const timestampDefault = usePostgres ? "CURRENT_TIMESTAMP" : "CURRENT_TIMESTAMP";

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
      (isVercel && hasPostgres)
        ? "SELECT column_name as name FROM information_schema.columns WHERE table_name = 'products'"
        : "PRAGMA table_info(products)"
    );
    const columnNames = columns.map((c: any) => (c.name || c.column_name).toLowerCase());

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
};
