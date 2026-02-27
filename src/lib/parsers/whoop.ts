import { readFileSync, readdirSync, existsSync } from "fs";
import { DATA_PATHS } from "@/lib/constants";
import { WhoopDay } from "@/types";

export function getAllWhoopDays(): WhoopDay[] {
  const dir = DATA_PATHS.whoop;
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files
    .map((f) => {
      try {
        return JSON.parse(readFileSync(`${dir}/${f}`, "utf-8")) as WhoopDay;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as WhoopDay[];
}
