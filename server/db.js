import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'db.sqlite');
  dbInstance = new Database(dbPath);

  // Enable foreign keys
  dbInstance.pragma('foreign_keys = ON');

  // Create tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE,
      name TEXT,
      tagline TEXT,
      icon TEXT,
      image TEXT,
      desc TEXT,
      specs_json TEXT,
      benefits_json TEXT,
      health_json TEXT,
      wa_msg TEXT,
      trade_type TEXT DEFAULT 'export',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS varieties (
      id INTEGER PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      slug TEXT,
      name TEXT,
      code TEXT,
      tagline TEXT,
      image TEXT,
      desc TEXT,
      benefits_json TEXT,
      health_json TEXT,
      wa_msg TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT,
      excerpt TEXT,
      content TEXT,
      thumbnail TEXT,
      status TEXT DEFAULT 'draft',
      meta_title TEXT,
      meta_description TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY,
      filename TEXT,
      original_name TEXT,
      size INTEGER,
      mime_type TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      country TEXT,
      message TEXT,
      type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return dbInstance;
}
