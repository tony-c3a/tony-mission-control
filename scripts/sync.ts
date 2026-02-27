import Database from "better-sqlite3";
import { readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const CLAWD_PATH = process.env.CLAWD_PATH || "/home/clawdbot/clawd";
const DB_PATH = process.env.DB_PATH || "./data/mission-control.db";

// Ensure data directory
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
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

// ============ Sync Time Entries ============
function syncTimeEntries() {
  const dir = `${CLAWD_PATH}/timetracking/entries`;
  if (!existsSync(dir)) return 0;

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO time_entries (id, start, end, activity, category, duration_min, tags, source, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(`${dir}/${file}`, "utf-8"));
      const entries = Array.isArray(raw) ? raw : raw.entries || [];
      const fileDate = file.replace(".json", "");

      for (const e of entries) {
        upsert.run(
          e.id,
          e.start,
          e.end || null,
          e.activity,
          e.category,
          e.durationMin ?? null,
          JSON.stringify(e.tags || []),
          e.source || null,
          fileDate
        );
        count++;
      }
    } catch (err) {
      console.error(`Error parsing ${file}:`, err);
    }
  }

  return count;
}

// ============ Sync Ideas ============
function syncIdeas() {
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO ideas (id, timestamp, idea, tags, context, status, source, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;

  // ideas.json
  const jsonPath = `${CLAWD_PATH}/ideas/ideas.json`;
  if (existsSync(jsonPath)) {
    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
      for (const idea of data.ideas || []) {
        upsert.run(
          idea.id,
          idea.timestamp,
          idea.idea,
          JSON.stringify(idea.tags || []),
          idea.context || null,
          idea.status || "new",
          idea.source || "json",
          idea.priority || null
        );
        count++;
      }
    } catch (err) {
      console.error("Error parsing ideas.json:", err);
    }
  }

  // ideas.jsonl
  const jsonlPath = `${CLAWD_PATH}/ideas/ideas.jsonl`;
  if (existsSync(jsonlPath)) {
    try {
      const lines = readFileSync(jsonlPath, "utf-8").split("\n").filter((l) => l.trim());
      for (let i = 0; i < lines.length; i++) {
        try {
          const idea = JSON.parse(lines[i]);
          const id = idea.id || `jsonl-${i}`;
          upsert.run(
            id,
            idea.timestamp || new Date().toISOString(),
            idea.idea || "",
            JSON.stringify((idea.tags || []).map((t: string) => t.replace(/^#/, ""))),
            idea.context || null,
            idea.status || "new",
            idea.source || "jsonl",
            idea.priority || null
          );
          count++;
        } catch {}
      }
    } catch (err) {
      console.error("Error parsing ideas.jsonl:", err);
    }
  }

  return count;
}

// ============ Sync Todos ============
function syncTodos() {
  // Clear and re-insert (todos are parsed from markdown, no stable IDs)
  db.exec("DELETE FROM todos");

  const insert = db.prepare(`
    INSERT INTO todos (id, title, description, status, source, tags, due_date, priority, assignee, completed_date, section)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const genId = () => Math.random().toString(36).substring(2, 10);

  // Parse active.md
  const activePath = `${CLAWD_PATH}/todos/active.md`;
  if (existsSync(activePath)) {
    const content = readFileSync(activePath, "utf-8");
    let section = "";
    for (const line of content.split("\n")) {
      if (line.startsWith("## ") || line.startsWith("### ")) {
        section = line.replace(/^#+\s*/, "").trim();
        continue;
      }
      const m = line.match(/^-\s*\[([ x])\]\s+(.+)/);
      if (!m) continue;
      const raw = m[2];
      const tags = (raw.match(/#[\w-]+/g) || []).map((t) => t.replace(/^#/, ""));
      const due = raw.match(/@due:(\S+)/)?.[1];
      const urgent = /\s!(\s|$)/.test(raw) || raw.trim().endsWith("!");
      const title = raw.replace(/#[\w-]+/g, "").replace(/@due:\S+/g, "").replace(/\s!\s*$/, "").replace(/\s!(\s)/g, "$1").replace(/\s+/g, " ").trim();
      insert.run(genId(), title, null, m[1] === "x" ? "done" : "todo", "active", JSON.stringify(tags), due || null, urgent ? "urgent" : section.toLowerCase().includes("high") ? "high" : "normal", null, null, section);
      count++;
    }
  }

  // Parse inbox.md
  const inboxPath = `${CLAWD_PATH}/todos/inbox.md`;
  if (existsSync(inboxPath)) {
    const content = readFileSync(inboxPath, "utf-8");
    for (const line of content.split("\n").filter((l) => l.trim())) {
      const pipeM = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s*\|\s*TODO:\s*(.+)/);
      if (pipeM) {
        const raw = pipeM[2];
        const tags = (raw.match(/#[\w-]+/g) || []).map((t) => t.replace(/^#/, ""));
        const title = raw.replace(/#[\w-]+/g, "").replace(/\s+/g, " ").trim();
        insert.run(genId(), title, null, "todo", "inbox", JSON.stringify(tags), null, "normal", null, null, null);
        count++;
      }
    }
  }

  // Parse completed.md
  const completedPath = `${CLAWD_PATH}/todos/completed.md`;
  if (existsSync(completedPath)) {
    const content = readFileSync(completedPath, "utf-8");
    let date = "";
    for (const line of content.split("\n")) {
      const dm = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
      if (dm) { date = dm[1]; continue; }
      const cm = line.match(/^-\s*\[x\]\s+(.+)/);
      if (cm) {
        const raw = cm[1];
        const tags = (raw.match(/#[\w-]+/g) || []).map((t) => t.replace(/^#/, ""));
        const title = raw.replace(/#[\w-]+/g, "").replace(/\s+/g, " ").trim();
        insert.run(genId(), title, null, "done", "completed", JSON.stringify(tags), null, "normal", null, date, null);
        count++;
      }
    }
  }

  // Parse someday.md
  const somedayPath = `${CLAWD_PATH}/todos/someday.md`;
  if (existsSync(somedayPath)) {
    const content = readFileSync(somedayPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith("# ") || line.startsWith("Ideas")) continue;
      const bm = line.match(/^-\s+(.+)/);
      if (bm) {
        const raw = bm[1];
        const tags = (raw.match(/#[\w-]+/g) || []).map((t) => t.replace(/^#/, ""));
        const title = raw.replace(/#[\w-]+/g, "").replace(/\s+/g, " ").trim();
        insert.run(genId(), title, null, "todo", "someday", JSON.stringify(tags), null, "low", null, null, null);
        count++;
      }
    }
  }

  return count;
}

// ============ Sync Workouts ============
function syncWorkouts() {
  const dir = `${CLAWD_PATH}/workouts/entries`;
  if (!existsSync(dir)) return 0;

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO workout_sessions (id, date, workout_start, entries, total_exercises, total_sets)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(`${dir}/${file}`, "utf-8"));
      const totalExercises = data.entries?.length || 0;
      const totalSets = (data.entries || []).reduce(
        (acc: number, e: { sets?: unknown[] }) => acc + (e.sets?.length || 0),
        0
      );

      upsert.run(
        `workout-${data.date}`,
        data.date,
        data.workout_start || null,
        JSON.stringify(data.entries || []),
        totalExercises,
        totalSets
      );
      count++;
    } catch (err) {
      console.error(`Error parsing workout ${file}:`, err);
    }
  }

  return count;
}

// ============ Sync Whoop ============
function syncWhoop() {
  const dir = `${CLAWD_PATH}/whoop`;
  if (!existsSync(dir)) return 0;

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO whoop_days (date, recovery, strain, sleep, workouts, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(`${dir}/${file}`, "utf-8"));
      // Extract scalar values from potentially nested objects
      const recovery = typeof data.recovery === "object" && data.recovery !== null
        ? data.recovery.score ?? null
        : data.recovery ?? null;
      const strain = typeof data.strain === "object" && data.strain !== null
        ? data.strain.day_strain ?? null
        : data.strain ?? null;
      const sleep = typeof data.sleep === "object" && data.sleep !== null
        ? data.sleep.total_hours ?? null
        : data.sleep ?? null;

      upsert.run(
        data.date,
        recovery,
        strain,
        sleep,
        JSON.stringify(data.workouts || []),
        data.note || null
      );
      count++;
    } catch (err) {
      console.error(`Error parsing whoop ${file}:`, err);
    }
  }

  return count;
}

// ============ Run Sync ============
console.log("Starting sync...");
const t0 = Date.now();

const timeCount = syncTimeEntries();
console.log(`  Time entries: ${timeCount}`);

const ideaCount = syncIdeas();
console.log(`  Ideas: ${ideaCount}`);

const todoCount = syncTodos();
console.log(`  Todos: ${todoCount}`);

const workoutCount = syncWorkouts();
console.log(`  Workouts: ${workoutCount}`);

const whoopCount = syncWhoop();
console.log(`  Whoop days: ${whoopCount}`);

console.log(`Sync completed in ${Date.now() - t0}ms`);

db.close();
