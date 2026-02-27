import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DB_PATH || "./data/mission-control.db";

// Ensure directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    start TEXT NOT NULL,
    end TEXT,
    activity TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_min REAL,
    tags TEXT DEFAULT '[]',
    source TEXT,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    idea TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    context TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    source TEXT,
    priority TEXT
  );

  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    source TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'normal',
    assignee TEXT,
    completed_date TEXT,
    section TEXT
  );

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    workout_start TEXT,
    entries TEXT NOT NULL,
    total_exercises INTEGER DEFAULT 0,
    total_sets INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS whoop_days (
    date TEXT PRIMARY KEY,
    recovery REAL,
    strain REAL,
    sleep REAL,
    workouts TEXT DEFAULT '[]',
    note TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
  CREATE INDEX IF NOT EXISTS idx_time_entries_category ON time_entries(category);
  CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
  CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
  CREATE INDEX IF NOT EXISTS idx_todos_source ON todos(source);
`);

export const db = drizzle(sqlite, { schema });
export { sqlite };
