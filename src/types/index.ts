// ============ Time Tracking ============

export interface TimeEntry {
  id: string;
  start: string;
  end: string | null;
  activity: string;
  category: string;
  durationMin: number | null;
  tags: string[];
  source?: string;
}

export interface TimeTrackerState {
  schemaVersion: number;
  currentEntry: {
    id: string;
    start: string;
    activity: string;
    category: string;
    tags: string[];
  } | null;
  lastPing: string;
  focusMode: { active: boolean };
  timezone: string;
}

export interface TimeStats {
  totalMinutes: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
  entries: TimeEntry[];
}

// ============ Ideas ============

export type IdeaStatus = "new" | "exploring" | "building" | "done" | "archived";

export interface Idea {
  id: string;
  timestamp: string;
  idea: string;
  tags: string[];
  context?: string;
  status: IdeaStatus;
  related?: string[];
  source?: string;
  priority?: string;
}

// ============ Todos ============

export type TodoStatus = "todo" | "in_progress" | "done" | "blocked";
export type TodoSource = "active" | "inbox" | "completed" | "someday";
export type TodoPriority = "urgent" | "high" | "normal" | "low";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  source: TodoSource;
  tags: string[];
  dueDate?: string;
  priority: TodoPriority;
  assignee?: string;
  completedDate?: string;
  section?: string;
}

// ============ Workouts ============

export interface WorkoutSet {
  reps?: number;
  weight_kg?: number;
  duration_min?: number;
  note?: string;
}

export interface WorkoutEntry {
  exercise: string;
  sets: WorkoutSet[];
  timestamp?: string;
  note?: string;
}

export interface WorkoutDay {
  date: string;
  workout_start?: string;
  entries: WorkoutEntry[];
}

export interface Exercise {
  name: string;
  muscles: string[];
  type: string;
  equipment: string;
}

// ============ Memory ============

export interface MemoryEntry {
  date: string;
  content: string;
  sections: MemorySection[];
}

export interface MemorySection {
  title: string;
  content: string;
  time?: string;
}

// ============ Whoop ============

export interface WhoopDay {
  date: string;
  recovery: number | null;
  strain: number | null;
  sleep: number | null;
  workouts: unknown[];
  note?: string;
}

// ============ Agent Status ============

export type AgentState = "active" | "idle" | "busy" | "sleeping";

export interface AgentStatus {
  state: AgentState;
  currentActivity: string | null;
  lastAction: string | null;
  sessionCount: number;
  uptime?: string;
}

// ============ SSE ============

export type SSEEventType =
  | "time-update"
  | "idea-added"
  | "todo-changed"
  | "memory-update"
  | "status-change"
  | "workout-logged"
  | "connected";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: string;
}
