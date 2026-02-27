"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Todo, TodoSource } from "@/types";
import { Plus, Search, CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";

const STATUS_ICONS = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertCircle,
};

const PRIORITY_COLORS = {
  urgent: "text-red-400",
  high: "text-amber-400",
  normal: "text-foreground",
  low: "text-muted-foreground",
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<TodoSource | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState("");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sourceFilter) params.set("source", sourceFilter);

  const { data, isLoading } = useQuery<{ todos: Todo[] }>({
    queryKey: ["todos", search, sourceFilter],
    queryFn: () => fetch(`/api/todos?${params}`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: { title: string; tags: string[] }) =>
      fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTitle("");
      setNewTags("");
      setDialogOpen(false);
    },
  });

  const todos = data?.todos || [];

  // Group by status for kanban-style view
  const todoItems = todos.filter((t) => t.status === "todo");
  const doneItems = todos.filter((t) => t.status === "done");

  // Sections available in data (used for filtering in future)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            {todoItems.length} open, {doneItems.length} done
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task to Inbox</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                placeholder="Task title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle) {
                    createMutation.mutate({
                      title: newTitle,
                      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
                    });
                  }
                }}
              />
              <Input
                placeholder="Tags (comma separated)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
              <Button
                onClick={() =>
                  createMutation.mutate({
                    title: newTitle,
                    tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                disabled={!newTitle || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={sourceFilter === "" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSourceFilter("")}
          >
            All
          </Button>
          {(["active", "inbox", "completed", "someday"] as TodoSource[]).map((s) => (
            <Button
              key={s}
              variant={sourceFilter === s ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSourceFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Tasks by Section */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Open Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Circle className="w-4 h-4 text-blue-400" />
                Open ({todoItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {todoItems.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No open tasks
                </p>
              )}
              {todoItems.map((todo) => (
                <TaskRow key={todo.id} todo={todo} />
              ))}
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Done ({doneItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {doneItems.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No completed tasks
                </p>
              )}
              {doneItems.map((todo) => (
                <TaskRow key={todo.id} todo={todo} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TaskRow({ todo }: { todo: Todo }) {
  const Icon = STATUS_ICONS[todo.status];
  const priorityColor = PRIORITY_COLORS[todo.priority];

  return (
    <div className="flex items-start gap-2 py-2 px-2 rounded hover:bg-accent/30 transition-colors">
      <Icon
        className={`w-4 h-4 mt-0.5 shrink-0 ${todo.status === "done" ? "text-emerald-400" : "text-muted-foreground"}`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${priorityColor} ${todo.status === "done" ? "line-through opacity-60" : ""}`}>
          {todo.title}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {todo.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">
              {tag}
            </Badge>
          ))}
          {todo.dueDate && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-400 border-amber-400/30">
              due {todo.dueDate}
            </Badge>
          )}
          {todo.section && (
            <span className="text-[10px] text-muted-foreground">{todo.section}</span>
          )}
        </div>
      </div>
      {todo.priority === "urgent" && (
        <Badge variant="destructive" className="text-[10px] shrink-0">
          !
        </Badge>
      )}
    </div>
  );
}
