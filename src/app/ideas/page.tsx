"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { Idea, IdeaStatus } from "@/types";
import { relativeTime } from "@/lib/utils";
import { Plus, Search, Grid3X3, List } from "lucide-react";

const STATUS_COLORS: Record<IdeaStatus, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  exploring: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  building: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  done: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default function IdeasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "">("");
  const [tagFilter, setTagFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newIdea, setNewIdea] = useState("");
  const [newTags, setNewTags] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter) params.set("status", statusFilter);
  if (tagFilter) params.set("tag", tagFilter);

  const { data, isLoading } = useQuery<{ ideas: Idea[] }>({
    queryKey: ["ideas", search, statusFilter, tagFilter],
    queryFn: () => fetch(`/api/ideas?${params}`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: { idea: string; tags: string[] }) =>
      fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      setNewIdea("");
      setNewTags("");
      setDialogOpen(false);
    },
  });

  const ideas = data?.ideas || [];

  // Collect all unique tags for filter
  const allTags = Array.from(new Set(ideas.flatMap((i) => i.tags))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ideas Hub</h1>
          <p className="text-muted-foreground text-sm">{ideas.length} ideas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> New Idea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Idea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <textarea
                className="w-full bg-secondary rounded-md p-3 text-sm min-h-[100px] resize-none border-0 focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="What's the idea?"
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
              />
              <Input
                placeholder="Tags (comma separated)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
              <Button
                onClick={() =>
                  createMutation.mutate({
                    idea: newIdea,
                    tags: newTags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                disabled={!newIdea || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Adding..." : "Add Idea"}
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
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={statusFilter === "" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("")}
          >
            All
          </Button>
          {(["new", "exploring", "building", "done"] as IdeaStatus[]).map(
            (s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="capitalize"
              >
                {s}
              </Button>
            )
          )}
        </div>
        {allTags.length > 0 && (
          <select
            className="bg-secondary text-sm rounded-md px-2 py-1 border-0"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Ideas Grid/List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : ideas.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No ideas found
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className="cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() =>
                setExpandedId(expandedId === idea.id ? null : idea.id)
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_COLORS[idea.status]}`}
                  >
                    {idea.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(idea.timestamp)}
                  </span>
                </div>
                <p
                  className={`text-sm ${expandedId === idea.id ? "" : "line-clamp-3"}`}
                >
                  {idea.idea}
                </p>
                {expandedId === idea.id && idea.context && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {idea.context}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {idea.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className="cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() =>
                setExpandedId(expandedId === idea.id ? null : idea.id)
              }
            >
              <CardContent className="py-3 flex items-start gap-3">
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${STATUS_COLORS[idea.status]}`}
                >
                  {idea.status}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${expandedId === idea.id ? "" : "line-clamp-1"}`}
                  >
                    {idea.idea}
                  </p>
                  {expandedId === idea.id && idea.context && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {idea.context}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {idea.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {relativeTime(idea.timestamp)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
