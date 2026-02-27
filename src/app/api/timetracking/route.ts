import { NextRequest, NextResponse } from "next/server";
import {
  getAllTimeEntries,
  getTimeEntriesByDateRange,
  getTimeTrackerState,
} from "@/lib/parsers/time-entries";
import { dateToKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const category = searchParams.get("category");
  const today = searchParams.get("today");

  let entries;
  if (today !== null) {
    const todayStr = dateToKey(new Date());
    entries = getTimeEntriesByDateRange(todayStr, todayStr);
  } else if (startDate && endDate) {
    entries = getTimeEntriesByDateRange(startDate, endDate);
  } else {
    entries = getAllTimeEntries();
  }

  if (category) {
    entries = entries.filter((e) => e.category === category);
  }

  const state = getTimeTrackerState();

  return NextResponse.json({
    entries,
    total: entries.length,
    currentActivity: state?.currentEntry || null,
  });
}
