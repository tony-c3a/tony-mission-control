"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TonyAvatar } from "@/components/tony-avatar";
import { AGENT_STATE_LABELS, CATEGORY_COLORS } from "@/lib/constants";
import { formatMinutes, relativeTime } from "@/lib/utils";
import { AgentStatus, Idea, Todo } from "@/types";
import {
  Lightbulb,
  CheckSquare,
  Clock,
  Plus,
  Activity,
  Zap,
  Coffee,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: status } = useQuery<AgentStatus>({
    queryKey: ["status"],
    queryFn: () => fetch("/api/status").then((r) => r.json()),
    refetchInterval: 15000,
  });

  const { data: timeStats } = useQuery({
    queryKey: ["timeStats"],
    queryFn: () => fetch("/api/timetracking/stats").then((r) => r.json()),
  });

  const { data: todosData } = useQuery<{ todos: Todo[] }>({
    queryKey: ["todos", "active"],
    queryFn: () => fetch("/api/todos?source=active&status=todo").then((r) => r.json()),
  });

  const { data: ideasData } = useQuery<{ ideas: Idea[] }>({
    queryKey: ["ideas"],
    queryFn: () => fetch("/api/ideas").then((r) => r.json()),
  });

  const { data: memoryData } = useQuery({
    queryKey: ["memory", "recent"],
    queryFn: () => fetch("/api/memory?limit=5").then((r) => r.json()),
  });

  const activeTodos = todosData?.todos?.slice(0, 5) || [];
  const recentIdeas = ideasData?.ideas?.slice(0, 5) || [];
  const todayMinutes = timeStats?.today?.minutes || 0;
  const todayCategories = timeStats?.today?.byCategory || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Mission Control</h1>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Top Row: Status + Today's Focus + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tony Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TonyAvatar state={status?.state || "sleeping"} size="lg" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {AGENT_STATE_LABELS[status?.state || "sleeping"]}
                </h3>
                {status?.currentActivity ? (
                  <p className="text-sm text-muted-foreground">
                    Working on: {status.currentActivity}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No current activity
                  </p>
                )}
                {status?.lastAction && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last action: {relativeTime(status.lastAction)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Focus */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today&apos;s Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatMinutes(todayMinutes)}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(todayCategories)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 4)
                .map(([cat, mins]) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="text-xs"
                    style={{
                      borderLeft: `3px solid ${CATEGORY_COLORS[cat] || "#666"}`,
                    }}
                  >
                    {cat}: {formatMinutes(mins as number)}
                  </Badge>
                ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> {timeStats?.focusSessions || 0} sessions
              </span>
              <span className="flex items-center gap-1">
                <Coffee className="w-3 h-3" /> {formatMinutes(timeStats?.breakMinutes || 0)} breaks
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Plus className="w-3 h-3" /> New Task
              </Button>
            </Link>
            <Link href="/ideas">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Lightbulb className="w-3 h-3" /> Add Idea
              </Button>
            </Link>
            <Link href="/time">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Clock className="w-3 h-3" /> View Time
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Tasks + Ideas + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Active Tasks
              </CardTitle>
              <Link href="/tasks">
                <Badge variant="secondary" className="text-xs cursor-pointer">
                  {todosData?.todos?.length || 0}
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeTodos.length === 0 && (
                <p className="text-xs text-muted-foreground">No active tasks</p>
              )}
              {activeTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-2 text-sm py-1 border-b border-border/50 last:border-0"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      backgroundColor:
                        todo.priority === "urgent"
                          ? "#EF4444"
                          : todo.priority === "high"
                            ? "#F59E0B"
                            : "#6B7280",
                    }}
                  />
                  <span className="text-xs leading-tight">{todo.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ideas Queue */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Ideas Queue
              </CardTitle>
              <Link href="/ideas">
                <Badge variant="secondary" className="text-xs cursor-pointer">
                  {ideasData?.ideas?.length || 0}
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentIdeas.length === 0 && (
                <p className="text-xs text-muted-foreground">No ideas yet</p>
              )}
              {recentIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="text-xs py-1 border-b border-border/50 last:border-0"
                >
                  <p className="leading-tight line-clamp-2">{idea.idea}</p>
                  <div className="flex gap-1 mt-1">
                    {idea.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Memory
              </CardTitle>
              <Link href="/memory">
                <Badge variant="secondary" className="text-xs cursor-pointer">
                  View All
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(memoryData?.entries || []).slice(0, 5).map((entry: { date: string; sections: { title: string }[] }) => (
                <div
                  key={entry.date}
                  className="text-xs py-1 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">{entry.date}</span>
                  {entry.sections?.[0] && (
                    <p className="leading-tight mt-0.5 line-clamp-1">
                      {entry.sections[0].title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
