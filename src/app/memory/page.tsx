"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MemoryEntry } from "@/types";
import { Search, Calendar, ChevronDown, ChevronRight } from "lucide-react";

export default function MemoryPage() {
  const [search, setSearch] = useState("");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", String(limit));

  const { data, isLoading } = useQuery<{ entries: MemoryEntry[]; total: number }>({
    queryKey: ["memory", search, limit],
    queryFn: () => fetch(`/api/memory?${params}`).then((r) => r.json()),
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Memory Stream</h1>
        <p className="text-muted-foreground text-sm">
          {total} days of memory logs
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search memory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No memory entries found
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isExpanded = expandedDate === entry.date;

            return (
              <Card
                key={entry.date}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <CardHeader
                  className="pb-2"
                  onClick={() =>
                    setExpandedDate(isExpanded ? null : entry.date)
                  }
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Calendar className="w-4 h-4" />
                      {entry.date}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {entry.sections.length} section{entry.sections.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {!isExpanded && entry.sections.length > 0 && (
                    <p className="text-xs text-muted-foreground ml-10 line-clamp-1">
                      {entry.sections.map((s) => s.title).join(" | ")}
                    </p>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4 ml-6">
                      {entry.sections.map((section, i) => (
                        <div key={i} className="border-l-2 border-border pl-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">
                              {section.title}
                            </h4>
                            {section.time && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                {section.time}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                            {section.content}
                          </div>
                        </div>
                      ))}

                      {entry.sections.length === 0 && (
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                          {entry.content}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {entries.length < total && (
            <button
              onClick={() => setLimit((l) => l + 20)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-3"
            >
              Load more ({total - entries.length} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
