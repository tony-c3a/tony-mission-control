"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutDay, WhoopDay, Exercise } from "@/types";
import { Dumbbell, Heart, Calendar, Trophy, TrendingUp } from "lucide-react";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { dateToKey } from "@/lib/utils";

export default function HabitsPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data } = useQuery<{
    workouts: WorkoutDay[];
    exercises: Record<string, Exercise>;
    whoopDays: WhoopDay[];
    stats: { totalSessions: number; totalExercises: number; totalSets: number };
  }>({
    queryKey: ["workouts"],
    queryFn: () => fetch("/api/workouts").then((r) => r.json()),
  });

  const workouts = data?.workouts || [];
  const exercises = data?.exercises || {};
  const whoopDays = data?.whoopDays || [];
  const stats = data?.stats || { totalSessions: 0, totalExercises: 0, totalSets: 0 };

  // Build workout dates set
  const workoutDates = new Set(workouts.map((w) => w.date));

  // Get selected workout
  const selectedWorkout = selectedDate
    ? workouts.find((w) => w.date === selectedDate)
    : null;

  // Whoop data with actual values
  const validWhoop = whoopDays.filter(
    (w) => w.recovery !== null || w.strain !== null || w.sleep !== null
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Habits & Health</h1>
        <p className="text-muted-foreground text-sm">
          Workouts, recovery, and streaks
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Dumbbell className="w-4 h-4" />
              <span className="text-xs">Sessions</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">Exercises</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalExercises}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Total Sets</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalSets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Whoop Days</span>
            </div>
            <p className="text-2xl font-bold">{validWhoop.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workout Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Workout Calendar (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const date = dateToKey(subDays(new Date(), 29 - i));
                const hasWorkout = workoutDates.has(date);
                const isSelected = date === selectedDate;

                return (
                  <button
                    key={date}
                    className={`aspect-square rounded-sm flex items-center justify-center text-[9px] transition-colors ${
                      isSelected
                        ? "ring-1 ring-blue-400"
                        : ""
                    } ${
                      hasWorkout
                        ? "bg-orange-500/30 text-orange-300 hover:bg-orange-500/40"
                        : "bg-secondary hover:bg-accent"
                    }`}
                    onClick={() =>
                      setSelectedDate(isSelected ? null : date)
                    }
                    title={date}
                  >
                    {format(new Date(date + "T12:00:00"), "d")}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-orange-500/30" />
                Workout day
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-secondary" />
                Rest day
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              {selectedWorkout
                ? `Workout: ${selectedWorkout.date}`
                : "Select a day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedWorkout ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Click a workout day to see details
              </p>
            ) : (
              <div className="space-y-3">
                {selectedWorkout.workout_start && (
                  <p className="text-xs text-muted-foreground">
                    Started at {selectedWorkout.workout_start}
                  </p>
                )}
                {selectedWorkout.entries.map((entry, i) => {
                  const exerciseInfo = exercises[entry.exercise];
                  return (
                    <div key={i} className="border-b border-border/50 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {exerciseInfo?.name || entry.exercise}
                        </span>
                        {entry.timestamp && (
                          <span className="text-[10px] text-muted-foreground">
                            {entry.timestamp}
                          </span>
                        )}
                      </div>
                      {exerciseInfo && (
                        <div className="flex gap-1 mt-1">
                          {exerciseInfo.muscles.slice(0, 3).map((m) => (
                            <Badge
                              key={m}
                              variant="outline"
                              className="text-[9px] px-1 py-0"
                            >
                              {m}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {entry.sets.map((set, j) => (
                          <span
                            key={j}
                            className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded"
                          >
                            {set.weight_kg ? `${set.weight_kg}kg x ` : ""}
                            {set.reps ? `${set.reps} reps` : ""}
                            {set.duration_min ? `${set.duration_min} min` : ""}
                            {set.note ? ` (${set.note})` : ""}
                          </span>
                        ))}
                      </div>
                      {entry.note && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Whoop Data */}
      {validWhoop.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Whoop Recovery Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {validWhoop
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 12)
                .map((day) => (
                  <div
                    key={day.date}
                    className="bg-secondary rounded-md p-2 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {day.date}
                    </p>
                    {day.recovery !== null && (
                      <p className="text-sm font-medium text-emerald-400">
                        {day.recovery}% rec
                      </p>
                    )}
                    {day.strain !== null && (
                      <p className="text-xs text-amber-400">
                        {day.strain} strain
                      </p>
                    )}
                    {day.sleep !== null && (
                      <p className="text-xs text-blue-400">
                        {day.sleep}h sleep
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
