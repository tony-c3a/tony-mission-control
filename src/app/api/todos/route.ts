import { NextRequest, NextResponse } from "next/server";
import { getAllTodos, appendInboxTodo } from "@/lib/parsers/todos";
import { TodoSource, TodoStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") as TodoSource | null;
  const status = searchParams.get("status") as TodoStatus | null;
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");

  let todos = getAllTodos();

  if (source) {
    todos = todos.filter((t) => t.source === source);
  }

  if (status) {
    todos = todos.filter((t) => t.status === status);
  }

  if (tag) {
    todos = todos.filter((t) =>
      t.tags.some((tt) => tt.toLowerCase() === tag.toLowerCase())
    );
  }

  if (search) {
    const lower = search.toLowerCase();
    todos = todos.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.description?.toLowerCase().includes(lower)
    );
  }

  return NextResponse.json({ todos, total: todos.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, tags = [] } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const newTodo = appendInboxTodo(title, tags);
  return NextResponse.json(newTodo, { status: 201 });
}
