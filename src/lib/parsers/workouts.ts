import { readFileSync, readdirSync, existsSync } from "fs";
import { DATA_PATHS } from "@/lib/constants";
import { WorkoutDay, Exercise } from "@/types";

export function parseWorkoutFile(filePath: string): WorkoutDay | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function getAllWorkouts(): WorkoutDay[] {
  const dir = DATA_PATHS.workoutEntries;
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files
    .map((f) => parseWorkoutFile(`${dir}/${f}`))
    .filter(Boolean) as WorkoutDay[];
}

export function getExerciseLibrary(): Record<string, Exercise> {
  const filePath = DATA_PATHS.exercises;
  if (!existsSync(filePath)) return {};

  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return data.exercises || {};
  } catch {
    return {};
  }
}
