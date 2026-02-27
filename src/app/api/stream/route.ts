import { NextResponse } from "next/server";
import { eventBus } from "@/lib/sse/event-bus";
import { initFileWatcher } from "@/lib/file-watcher";

export const dynamic = "force-dynamic";

// Initialize file watcher on first request
let watcherStarted = false;

export async function GET() {
  if (!watcherStarted) {
    initFileWatcher();
    watcherStarted = true;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send connected event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
        )
      );

      // Subscribe to event bus
      const unsubscribe = eventBus.subscribe((event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          unsubscribe();
        }
      });

      // Keep-alive every 30s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
          unsubscribe();
        }
      }, 30000);

      // Store cleanup
      const cleanup = () => {
        clearInterval(keepAlive);
        unsubscribe();
      };

      // Attach cleanup for cancel
      (controller as unknown as { _cleanup: () => void })._cleanup = cleanup;
    },
    cancel() {
      // Client disconnected
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
