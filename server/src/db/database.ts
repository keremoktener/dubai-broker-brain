import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'broker_brain.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    // Migration: add category column if not present
    try {
      db.exec(`ALTER TABLE content_history ADD COLUMN category TEXT NOT NULL DEFAULT ''`);
    } catch {
      // Column already exists — ignore
    }
  }
  return db;
}

function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'agent',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      area TEXT NOT NULL,
      property_type TEXT NOT NULL,
      price_per_sqft REAL NOT NULL,
      transactions INTEGER NOT NULL,
      avg_price REAL NOT NULL,
      volume REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      budget REAL,
      interest TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      assigned_to INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guid TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      link TEXT,
      source TEXT NOT NULL,
      published_at TEXT,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      summary TEXT NOT NULL,
      article_count INTEGER NOT NULL,
      generated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sparring_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      target_persona TEXT NOT NULL,
      news_summary TEXT NOT NULL,
      messages TEXT NOT NULL,
      message_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      persona_type TEXT NOT NULL DEFAULT 'investor',
      max_budget REAL NOT NULL,
      preferred_areas TEXT NOT NULL DEFAULT '[]',
      property_type TEXT NOT NULL DEFAULT 'apartment',
      urgency_level TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      topic TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrate sparring_sessions — add analysis columns if they don't exist yet
  (['closing_score INTEGER', 'missed_signals TEXT', 'veteran_rewrite TEXT'] as const).forEach((col) => {
    try { db.exec(`ALTER TABLE sparring_sessions ADD COLUMN ${col}`); } catch { /* already exists */ }
  });

  // Migrate clients — add preferred_areas column if it doesn't exist yet
  (['preferred_areas TEXT NOT NULL DEFAULT \'[]\''] as const).forEach((col) => {
    try { db.exec(`ALTER TABLE clients ADD COLUMN ${col}`); } catch { /* already exists */ }
  });
}
