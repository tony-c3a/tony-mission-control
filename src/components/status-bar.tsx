"use client";

import { useQuery } from "@tanstack/react-query";
import { TonyAvatar } from "./tony-avatar";
import { AGENT_STATE_LABELS } from "@/lib/constants";
import { AgentStatus } from "@/types";
import { relativeTime } from "@/lib/utils";

export function StatusBar() {
  const { data: status } = useQuery<AgentStatus>({
    queryKey: ["status"],
    queryFn: () => fetch("/api/status").then((r) => r.json()),
    refetchInterval: 15000,
  });

  if (!status) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-card/80 backdrop-blur border-t border-border flex items-center px-4 gap-3 text-xs text-muted-foreground z-50">
      <TonyAvatar state={status.state} size="sm" />
      <span className="font-medium text-foreground">
        Tony: {AGENT_STATE_LABELS[status.state]}
      </span>
      {status.currentActivity && (
        <>
          <span className="text-border">|</span>
          <span>{status.currentActivity}</span>
        </>
      )}
      {status.lastAction && (
        <>
          <span className="text-border">|</span>
          <span>Last: {relativeTime(status.lastAction)}</span>
        </>
      )}
      <div className="ml-auto">
        {status.sessionCount > 0 && (
          <span>{status.sessionCount} session{status.sessionCount > 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  );
}
