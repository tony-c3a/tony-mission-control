import { AgentState } from "@/types";

export const CLAWD_PATH = process.env.CLAWD_PATH || "/home/clawdbot/clawd";

export const DATA_PATHS = {
  ideas: `${CLAWD_PATH}/ideas`,
  ideasJson: `${CLAWD_PATH}/ideas/ideas.json`,
  ideasJsonl: `${CLAWD_PATH}/ideas/ideas.jsonl`,
  todos: `${CLAWD_PATH}/todos`,
  todosActive: `${CLAWD_PATH}/todos/active.md`,
  todosInbox: `${CLAWD_PATH}/todos/inbox.md`,
  todosCompleted: `${CLAWD_PATH}/todos/completed.md`,
  todosSomeday: `${CLAWD_PATH}/todos/someday.md`,
  timetracking: `${CLAWD_PATH}/timetracking`,
  timeEntries: `${CLAWD_PATH}/timetracking/entries`,
  timeState: `${CLAWD_PATH}/timetracking/state.json`,
  memory: `${CLAWD_PATH}/memory`,
  workouts: `${CLAWD_PATH}/workouts`,
  workoutEntries: `${CLAWD_PATH}/workouts/entries`,
  exercises: `${CLAWD_PATH}/workouts/exercises.json`,
  whoop: `${CLAWD_PATH}/whoop`,
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  cyt: "#3B82F6",       // blue
  mowafeq: "#8B5CF6",   // violet
  personal: "#10B981",  // emerald
  break: "#6B7280",     // gray
  health: "#EF4444",    // red
  admin: "#F59E0B",     // amber
  learning: "#06B6D4",  // cyan
  gym: "#F97316",       // orange
  fitness: "#F97316",   // orange
  "fd-consult": "#EC4899", // pink
  meeting: "#14B8A6",   // teal
  work: "#6366F1",      // indigo
  event: "#A855F7",     // purple
  freelance: "#84CC16", // lime
  other: "#78716C",     // stone
};

export const AGENT_STATE_COLORS: Record<AgentState, string> = {
  active: "#10B981",
  idle: "#F59E0B",
  busy: "#EF4444",
  sleeping: "#6B7280",
};

export const AGENT_STATE_LABELS: Record<AgentState, string> = {
  active: "Active",
  idle: "Idle",
  busy: "Busy",
  sleeping: "Sleeping",
};

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/ideas", label: "Ideas", icon: "Lightbulb" },
  { href: "/tasks", label: "Tasks", icon: "CheckSquare" },
  { href: "/time", label: "Time", icon: "Clock" },
  { href: "/habits", label: "Habits", icon: "Dumbbell" },
  { href: "/memory", label: "Memory", icon: "Brain" },
  { href: "/chat", label: "Chat", icon: "MessageSquare" },
] as const;
