import { readFileSync, readdirSync, existsSync } from "fs";
import { DATA_PATHS } from "@/lib/constants";
import { TimeEntry, TimeTrackerState } from "@/types";

interface RawTimeEntry {
  id: string;
  start: string;
  end?: string | null;
  activity: string;
  category: string;
  durationMin?: number | null;
  tags?: string[];
  source?: string;
}

export function parseTimeEntryFile(filePath: string): TimeEntry[] {
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));

    // Format B: { date, entries: [...] }
    const entries: RawTimeEntry[] = Array.isArray(raw) ? raw : raw.entries || [];

    return entries.map((e) => ({
      id: e.id,
      start: e.start,
      end: e.end || null,
      activity: e.activity,
      category: e.category,
      durationMin: e.durationMin ?? null,
      tags: e.tags || [],
      source: e.source,
    }));
  } catch {
    return [];
  }
}

export function getAllTimeEntries(): TimeEntry[] {
  const dir = DATA_PATHS.timeEntries;
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files.flatMap((f) => parseTimeEntryFile(`${dir}/${f}`));
}

export function getTimeEntriesByDateRange(
  startDate: string,
  endDate: string
): TimeEntry[] {
  const dir = DATA_PATHS.timeEntries;
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => {
      const date = f.replace(".json", "");
      return date >= startDate && date <= endDate;
    })
    .sort();

  return files.flatMap((f) => parseTimeEntryFile(`${dir}/${f}`));
}

export function getTimeTrackerState(): TimeTrackerState | null {
  try {
    return JSON.parse(readFileSync(DATA_PATHS.timeState, "utf-8"));
  } catch {
    return null;
  }
}

export function getDateFromEntry(entry: TimeEntry): string {
  return entry.start.split("T")[0];
}
