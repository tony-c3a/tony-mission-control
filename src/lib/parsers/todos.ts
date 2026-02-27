import { readFileSync, existsSync, appendFileSync } from "fs";
import { DATA_PATHS } from "@/lib/constants";
import { Todo, TodoPriority } from "@/types";
import { generateId, normalizeTag } from "@/lib/utils";

function extractTags(text: string): string[] {
  const matches = text.match(/#[\w-]+/g) || [];
  return matches.map(normalizeTag);
}

function extractDueDate(text: string): string | undefined {
  const match = text.match(/@due:(\S+)/);
  return match ? match[1] : undefined;
}

function hasPriorityMarker(text: string): boolean {
  // Check for ! at end of line or standalone ! marker
  return /\s!(\s|$)/.test(text) || text.trim().endsWith("!");
}

function cleanTitle(text: string): string {
  return text
    .replace(/#[\w-]+/g, "")
    .replace(/@due:\S+/g, "")
    .replace(/\s!\s*$/, "")
    .replace(/\s!(\s)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseActiveTodos(): Todo[] {
  const filePath = DATA_PATHS.todosActive;
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const todos: Todo[] = [];
  let currentSection = "";

  for (const line of lines) {
    // Track sections
    if (line.startsWith("## ") || line.startsWith("### ")) {
      currentSection = line.replace(/^#+\s*/, "").trim();
      continue;
    }

    // Parse checkbox items
    const checkMatch = line.match(/^-\s*\[([ x])\]\s+(.+)/);
    if (!checkMatch) continue;

    const done = checkMatch[1] === "x";
    const rawText = checkMatch[2];
    const tags = extractTags(rawText);
    const dueDate = extractDueDate(rawText);
    const isUrgent = hasPriorityMarker(rawText);

    const priority: TodoPriority = isUrgent
      ? "urgent"
      : currentSection.toLowerCase().includes("high priority")
        ? "high"
        : "normal";

    todos.push({
      id: generateId(),
      title: cleanTitle(rawText),
      status: done ? "done" : "todo",
      source: "active",
      tags,
      dueDate,
      priority,
      section: currentSection,
    });
  }

  return todos;
}

export function parseInboxTodos(): Todo[] {
  const filePath = DATA_PATHS.todosInbox;
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const todos: Todo[] = [];

  for (const line of lines) {
    // Format: ISO8601Z | TODO: description #tags
    const pipeMatch = line.match(
      /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s*\|\s*TODO:\s*(.+)/
    );
    if (pipeMatch) {
      const rawText = pipeMatch[2];
      const tags = extractTags(rawText);
      todos.push({
        id: generateId(),
        title: cleanTitle(rawText),
        status: "todo",
        source: "inbox",
        tags,
        priority: "normal",
      });
      continue;
    }

    // Simple bullet format
    const bulletMatch = line.match(/^-\s*\[([ x])\]\s+(.+)/);
    if (bulletMatch) {
      const rawText = bulletMatch[2];
      const tags = extractTags(rawText);
      todos.push({
        id: generateId(),
        title: cleanTitle(rawText),
        status: bulletMatch[1] === "x" ? "done" : "todo",
        source: "inbox",
        tags,
        priority: "normal",
      });
    }
  }

  return todos;
}

export function parseCompletedTodos(): Todo[] {
  const filePath = DATA_PATHS.todosCompleted;
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const todos: Todo[] = [];
  let currentDate = "";

  for (const line of lines) {
    // Date headers: ## YYYY-MM-DD
    const dateMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }

    const checkMatch = line.match(/^-\s*\[x\]\s+(.+)/);
    if (checkMatch) {
      const rawText = checkMatch[1];
      const tags = extractTags(rawText);
      todos.push({
        id: generateId(),
        title: cleanTitle(rawText),
        status: "done",
        source: "completed",
        tags,
        priority: "normal",
        completedDate: currentDate,
      });
    }
  }

  return todos;
}

export function parseSomedayTodos(): Todo[] {
  const filePath = DATA_PATHS.todosSomeday;
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const todos: Todo[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^-\s+(.+)/);
    if (bulletMatch && !line.startsWith("# ")) {
      const rawText = bulletMatch[1];
      const tags = extractTags(rawText);
      todos.push({
        id: generateId(),
        title: cleanTitle(rawText),
        status: "todo",
        source: "someday",
        tags,
        priority: "low",
      });
    }
  }

  return todos;
}

export function getAllTodos(): Todo[] {
  return [
    ...parseActiveTodos(),
    ...parseInboxTodos(),
    ...parseCompletedTodos(),
    ...parseSomedayTodos(),
  ];
}

export function appendInboxTodo(title: string, tags: string[] = []): Todo {
  const tagStr = tags.map((t) => `#${normalizeTag(t)}`).join(" ");
  const line = `${new Date().toISOString()} | TODO: ${title} ${tagStr}\n`;
  appendFileSync(DATA_PATHS.todosInbox, line);

  return {
    id: generateId(),
    title,
    status: "todo",
    source: "inbox",
    tags: tags.map(normalizeTag),
    priority: "normal",
  };
}
