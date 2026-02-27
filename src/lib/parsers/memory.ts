import { readFileSync, readdirSync, existsSync } from "fs";
import { DATA_PATHS } from "@/lib/constants";
import { MemoryEntry, MemorySection } from "@/types";

function parseSections(content: string): MemorySection[] {
  const sections: MemorySection[] = [];
  const lines = content.split("\n");
  let currentTitle = "";
  let currentContent: string[] = [];
  let currentTime: string | undefined;

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          content: currentContent.join("\n").trim(),
          time: currentTime,
        });
      }
      currentTitle = headerMatch[1];
      currentContent = [];
      // Try to extract time from title, e.g. "## Meeting - Feb 24, 2026 (8:58 AM UTC)"
      const timeMatch = currentTitle.match(/\((\d{1,2}:\d{2}\s*(?:AM|PM)?\s*UTC)\)/i);
      currentTime = timeMatch ? timeMatch[1] : undefined;
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }

  if (currentTitle) {
    sections.push({
      title: currentTitle,
      content: currentContent.join("\n").trim(),
      time: currentTime,
    });
  }

  return sections;
}

export function parseMemoryFile(filePath: string): MemoryEntry | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const filename = filePath.split("/").pop() || "";
    const date = filename.replace(".md", "");

    return {
      date,
      content,
      sections: parseSections(content),
    };
  } catch {
    return null;
  }
}

export function getAllMemoryEntries(): MemoryEntry[] {
  const dir = DATA_PATHS.memory;
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse();

  return files
    .map((f) => parseMemoryFile(`${dir}/${f}`))
    .filter(Boolean) as MemoryEntry[];
}

export function getMemoryByDate(date: string): MemoryEntry | null {
  const filePath = `${DATA_PATHS.memory}/${date}.md`;
  if (!existsSync(filePath)) return null;
  return parseMemoryFile(filePath);
}

export function searchMemory(query: string): MemoryEntry[] {
  const all = getAllMemoryEntries();
  const lower = query.toLowerCase();
  return all.filter(
    (entry) =>
      entry.content.toLowerCase().includes(lower) ||
      entry.sections.some(
        (s) =>
          s.title.toLowerCase().includes(lower) ||
          s.content.toLowerCase().includes(lower)
      )
  );
}
