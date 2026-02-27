"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SSEEventType } from "@/types";

const EVENT_TO_QUERY_KEYS: Record<SSEEventType, string[][]> = {
  "time-update": [["timeStats"], ["timeEntries"], ["status"]],
  "idea-added": [["ideas"]],
  "todo-changed": [["todos"]],
  "memory-update": [["memory"]],
  "status-change": [["status"]],
  "workout-logged": [["workouts"]],
  connected: [],
};

export function useEventStream() {
  const queryClient = useQueryClient();
  const retryRef = useRef(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;

      eventSource = new EventSource("/api/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const queryKeys = EVENT_TO_QUERY_KEYS[data.type as SSEEventType];
          if (queryKeys) {
            for (const key of queryKeys) {
              queryClient.invalidateQueries({ queryKey: key });
            }
          }
          retryRef.current = 0;
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        retryRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
        setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      mounted = false;
      eventSource?.close();
    };
  }, [queryClient]);
}
