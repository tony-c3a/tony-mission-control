import { NextRequest, NextResponse } from "next/server";
import { getAllIdeas, appendIdea } from "@/lib/parsers/ideas";
import { IdeaStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const status = searchParams.get("status") as IdeaStatus | null;
  const search = searchParams.get("search");

  let ideas = getAllIdeas();

  if (tag) {
    ideas = ideas.filter((i) =>
      i.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
  }

  if (status) {
    ideas = ideas.filter((i) => i.status === status);
  }

  if (search) {
    const lower = search.toLowerCase();
    ideas = ideas.filter(
      (i) =>
        i.idea.toLowerCase().includes(lower) ||
        i.context?.toLowerCase().includes(lower) ||
        i.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }

  return NextResponse.json({ ideas, total: ideas.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { idea, tags = [], context, status = "new", source } = body;

  if (!idea) {
    return NextResponse.json({ error: "Idea text is required" }, { status: 400 });
  }

  const newIdea = appendIdea({
    timestamp: new Date().toISOString(),
    idea,
    tags,
    context,
    status,
    source: source || "dashboard",
  });

  return NextResponse.json(newIdea, { status: 201 });
}
