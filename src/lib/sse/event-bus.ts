import { SSEEvent, SSEEventType } from "@/types";

type Listener = (event: SSEEvent) => void;

class EventBus {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(type: SSEEventType, data: unknown = {}) {
    const event: SSEEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Ignore errors from individual listeners
      }
    });
  }

  get subscriberCount(): number {
    return this.listeners.size;
  }
}

// Singleton
export const eventBus = new EventBus();
