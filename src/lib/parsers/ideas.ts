import { readFileSync, existsSync } from "fs";
import { DATA_PATHS } from "@/lib/constants";
import { Idea, IdeaStatus } from "@/types";
import { generateId, normalizeTag } from "@/lib/utils";

interface RawIdea {
  id?: string;
  timestamp?: string;
  idea?: string;
  tags?: string[];
  context?: string;
  status?: string;
  related?: string[];
  source?: string;
  priority?: string;
}

function normalizeIdea(raw: RawIdea): Idea {
  return {
    id: raw.id || generateId(),
    timestamp: raw.timestamp || new Date().toISOString(),
    idea: raw.idea || "",
    tags: (raw.tags || []).map(normalizeTag),
    context: raw.context,
    status: (raw.status as IdeaStatus) || "new",
    related: raw.related,
    source: raw.source,
    priority: raw.priority,
  };
}

export function parseIdeasJson(): Idea[] {
  const filePath = DATA_PATHS.ideasJson;
  if (!existsSync(filePath)) return [];

  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const ideas: RawIdea[] = data.ideas || [];
    return ideas.map(normalizeIdea);
  } catch {
    return [];
  }
}

export function parseIdeasJsonl(): Idea[] {
  const filePath = DATA_PATHS.ideasJsonl;
  if (!existsSync(filePath)) return [];

  try {
    const lines = readFileSync(filePath, "utf-8")
      .split("\n")
      .filter((l) => l.trim());

    return lines.map((line, i) => {
      try {
        const raw: RawIdea = JSON.parse(line);
        return normalizeIdea({ ...raw, id: raw.id || `jsonl-${i}` });
      } catch {
        return null;
      }
    }).filter(Boolean) as Idea[];
  } catch {
    return [];
  }
}

export function getAllIdeas(): Idea[] {
  const jsonIdeas = parseIdeasJson();
  const jsonlIdeas = parseIdeasJsonl();

  // Deduplicate by id, prefer json version
  const idMap = new Map<string, Idea>();
  for (const idea of [...jsonlIdeas, ...jsonIdeas]) {
    idMap.set(idea.id, idea);
  }

  return Array.from(idMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function appendIdea(idea: Omit<Idea, "id">): Idea {
  const { appendFileSync } = require("fs") as typeof import("fs"); // eslint-disable-line @typescript-eslint/no-require-imports
  const newIdea: Idea = { ...idea, id: generateId() };
  appendFileSync(DATA_PATHS.ideasJsonl, JSON.stringify(newIdea) + "\n");
  return newIdea;
}
