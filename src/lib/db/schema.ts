import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey(),
  start: text("start").notNull(),
  end: text("end"),
  activity: text("activity").notNull(),
  category: text("category").notNull(),
  durationMin: real("duration_min"),
  tags: text("tags").default("[]"), // JSON array
  source: text("source"),
  date: text("date").notNull(), // YYYY-MM-DD for easy grouping
});

export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  idea: text("idea").notNull(),
  tags: text("tags").default("[]"), // JSON array
  context: text("context"),
  status: text("status").notNull().default("new"),
  source: text("source"),
  priority: text("priority"),
});

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  source: text("source").notNull(),
  tags: text("tags").default("[]"), // JSON array
  dueDate: text("due_date"),
  priority: text("priority").notNull().default("normal"),
  assignee: text("assignee"),
  completedDate: text("completed_date"),
  section: text("section"),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  workoutStart: text("workout_start"),
  entries: text("entries").notNull(), // JSON array of WorkoutEntry
  totalExercises: integer("total_exercises").default(0),
  totalSets: integer("total_sets").default(0),
});

export const whoopDays = sqliteTable("whoop_days", {
  date: text("date").primaryKey(),
  recovery: real("recovery"),
  strain: real("strain"),
  sleep: real("sleep"),
  workouts: text("workouts").default("[]"), // JSON
  note: text("note"),
});
