"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatMinutes, dateToKey } from "@/lib/utils";
import { TimeEntry } from "@/types";
import { Clock, Zap, Coffee, TrendingUp, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";

export default function TimePage() {
  const [tab, setTab] = useState("today");

  const today = dateToKey(new Date());
  const weekAgo = dateToKey(subDays(new Date(), 7));
  const monthAgo = dateToKey(subDays(new Date(), 30));

  const { data: stats } = useQuery({
    queryKey: ["timeStats"],
    queryFn: () => fetch("/api/timetracking/stats").then((r) => r.json()),
  });

  const { data: weekData } = useQuery({
    queryKey: ["timeEntries", "week"],
    queryFn: () =>
      fetch(`/api/timetracking?start=${weekAgo}&end=${today}`).then((r) =>
        r.json()
      ),
  });

  const { data: monthData } = useQuery({
    queryKey: ["timeEntries", "month"],
    queryFn: () =>
      fetch(`/api/timetracking?start=${monthAgo}&end=${today}`).then((r) =>
        r.json()
      ),
  });

  const todayEntries: TimeEntry[] = stats?.today?.entries || [];
  const todayByCategory = stats?.today?.byCategory || {};
  const todayMinutes = stats?.today?.minutes || 0;

  // Prepare pie chart data
  const pieData = Object.entries(todayByCategory)
    .map(([name, value]) => ({
      name,
      value: value as number,
      color: CATEGORY_COLORS[name] || "#666",
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare week bar chart data
  const weekEntries: TimeEntry[] = weekData?.entries || [];
  const weekByDay: Record<string, Record<string, number>> = {};
  for (const entry of weekEntries) {
    const day = entry.start.split("T")[0];
    if (!weekByDay[day]) weekByDay[day] = {};
    weekByDay[day][entry.category] =
      (weekByDay[day][entry.category] || 0) + (entry.durationMin || 0);
  }

  const categories = Array.from(new Set(weekEntries.map((e) => e.category)));
  const barData = Array.from({ length: 7 }, (_, i) => {
    const date = dateToKey(subDays(new Date(), 6 - i));
    const dayData = weekByDay[date] || {};
    return {
      date: format(new Date(date + "T12:00:00"), "EEE"),
      ...dayData,
      total: Object.values(dayData).reduce((a, b) => a + b, 0),
    };
  });

  // Monthly calendar data
  const monthEntries: TimeEntry[] = monthData?.entries || [];
  const monthByDay: Record<string, number> = {};
  for (const entry of monthEntries) {
    const day = entry.start.split("T")[0];
    monthByDay[day] = (monthByDay[day] || 0) + (entry.durationMin || 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground text-sm">
            {stats?.totalDays || 0} days tracked
          </p>
        </div>
        {stats?.today?.entries?.length > 0 && (
          <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Activity className="w-3 h-3" /> Live
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Today</span>
            </div>
            <p className="text-2xl font-bold">{formatMinutes(todayMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold">{formatMinutes(stats?.totalMinutes || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Focus Sessions</span>
            </div>
            <p className="text-2xl font-bold">{stats?.focusSessions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coffee className="w-4 h-4" />
              <span className="text-xs">Break Time</span>
            </div>
            <p className="text-2xl font-bold">{formatMinutes(stats?.breakMinutes || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todayEntries.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No entries today
                    </p>
                  )}
                  {todayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[entry.category] || "#666",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{entry.activity}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(entry.start), "HH:mm")}
                          {entry.end &&
                            ` - ${format(new Date(entry.end), "HH:mm")}`}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0"
                        style={{
                          borderLeft: `2px solid ${CATEGORY_COLORS[entry.category] || "#666"}`,
                        }}
                      >
                        {entry.durationMin
                          ? formatMinutes(entry.durationMin)
                          : "live"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No data
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatMinutes(value as number)}
                          contentStyle={{
                            backgroundColor: "hsl(240 10% 3.9%)",
                            border: "1px solid hsl(240 3.7% 15.9%)",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pieData.map((d) => (
                        <div
                          key={d.name}
                          className="flex items-center gap-1 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          {d.name}: {formatMinutes(d.value)}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => formatMinutes(v)}
                  />
                  <Tooltip
                    formatter={(value) => formatMinutes(value as number)}
                    contentStyle={{
                      backgroundColor: "hsl(240 10% 3.9%)",
                      border: "1px solid hsl(240 3.7% 15.9%)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  {categories.map((cat) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="a"
                      fill={CATEGORY_COLORS[cat] || "#666"}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center gap-1 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[cat] || "#666",
                      }}
                    />
                    {cat}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last 30 Days Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const date = dateToKey(subDays(new Date(), 29 - i));
                  const mins = monthByDay[date] || 0;
                  const intensity = Math.min(mins / 480, 1); // 8h = max
                  return (
                    <div
                      key={date}
                      className="aspect-square rounded-sm flex items-center justify-center text-[9px] relative group"
                      style={{
                        backgroundColor: mins > 0
                          ? `rgba(59, 130, 246, ${0.15 + intensity * 0.75})`
                          : "hsl(240 3.7% 15.9%)",
                      }}
                      title={`${date}: ${formatMinutes(mins)}`}
                    >
                      {format(new Date(date + "T12:00:00"), "d")}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                {[0.15, 0.35, 0.55, 0.75, 0.9].map((v) => (
                  <div
                    key={v}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${v})`,
                    }}
                  />
                ))}
                <span>More</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
