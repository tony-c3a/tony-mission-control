import { NextRequest, NextResponse } from "next/server";
import {
  getAllMemoryEntries,
  getMemoryByDate,
  searchMemory,
} from "@/lib/parsers/memory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (date) {
    const entry = getMemoryByDate(date);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(entry);
  }

  if (search) {
    const results = searchMemory(search);
    return NextResponse.json({
      entries: results.slice(0, limit),
      total: results.length,
    });
  }

  const entries = getAllMemoryEntries();
  return NextResponse.json({
    entries: entries.slice(0, limit),
    total: entries.length,
  });
}
