import { NextResponse } from "next/server";
import { getAllWorkouts, getExerciseLibrary } from "@/lib/parsers/workouts";
import { getAllWhoopDays } from "@/lib/parsers/whoop";

export const dynamic = "force-dynamic";

export async function GET() {
  const workouts = getAllWorkouts();
  const exercises = getExerciseLibrary();
  const whoopDays = getAllWhoopDays();

  // Compute stats
  const totalSessions = workouts.length;
  const totalExercises = workouts.reduce(
    (acc, w) => acc + (w.entries?.length || 0),
    0
  );
  const totalSets = workouts.reduce(
    (acc, w) =>
      acc +
      (w.entries || []).reduce(
        (a, e) => a + (e.sets?.length || 0),
        0
      ),
    0
  );

  return NextResponse.json({
    workouts,
    exercises,
    whoopDays,
    stats: {
      totalSessions,
      totalExercises,
      totalSets,
    },
  });
}
