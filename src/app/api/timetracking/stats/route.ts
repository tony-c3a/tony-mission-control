import { NextRequest, NextResponse } from "next/server";
import {
  getAllTimeEntries,
  getTimeEntriesByDateRange,
} from "@/lib/parsers/time-entries";
import { dateToKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  const entries =
    startDate && endDate
      ? getTimeEntriesByDateRange(startDate, endDate)
      : getAllTimeEntries();

  // Total minutes
  const totalMinutes = entries.reduce(
    (acc, e) => acc + (e.durationMin || 0),
    0
  );

  // By category
  const byCategory: Record<string, number> = {};
  for (const entry of entries) {
    byCategory[entry.category] =
      (byCategory[entry.category] || 0) + (entry.durationMin || 0);
  }

  // By day
  const byDay: Record<string, number> = {};
  for (const entry of entries) {
    const day = entry.start.split("T")[0];
    byDay[day] = (byDay[day] || 0) + (entry.durationMin || 0);
  }

  // Today's stats
  const todayStr = dateToKey(new Date());
  const todayEntries = entries.filter(
    (e) => e.start.split("T")[0] === todayStr
  );
  const todayMinutes = todayEntries.reduce(
    (acc, e) => acc + (e.durationMin || 0),
    0
  );
  const todayByCategory: Record<string, number> = {};
  for (const entry of todayEntries) {
    todayByCategory[entry.category] =
      (todayByCategory[entry.category] || 0) + (entry.durationMin || 0);
  }

  // Focus sessions (entries with "deep-work" tag or >30 min work)
  const focusSessions = entries.filter(
    (e) =>
      e.tags.includes("deep-work") ||
      (e.durationMin && e.durationMin >= 30 && e.category !== "break")
  ).length;

  // Break minutes
  const breakMinutes = entries
    .filter((e) => e.category === "break")
    .reduce((acc, e) => acc + (e.durationMin || 0), 0);

  return NextResponse.json({
    totalMinutes,
    byCategory,
    byDay,
    today: {
      minutes: todayMinutes,
      byCategory: todayByCategory,
      entries: todayEntries,
    },
    focusSessions,
    breakMinutes,
    totalDays: Object.keys(byDay).length,
  });
}
