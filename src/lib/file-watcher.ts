import { watch } from "chokidar";
import { DATA_PATHS } from "@/lib/constants";
import { eventBus } from "@/lib/sse/event-bus";
import { SSEEventType } from "@/types";

let watcherInitialized = false;

const WATCH_PATHS: { path: string; event: SSEEventType }[] = [
  { path: `${DATA_PATHS.timeEntries}/**/*.json`, event: "time-update" },
  { path: DATA_PATHS.timeState, event: "time-update" },
  { path: `${DATA_PATHS.ideas}/*.json*`, event: "idea-added" },
  { path: `${DATA_PATHS.todos}/*.md`, event: "todo-changed" },
  { path: `${DATA_PATHS.memory}/*.md`, event: "memory-update" },
  { path: `${DATA_PATHS.workoutEntries}/**/*.json`, event: "workout-logged" },
];

export function initFileWatcher() {
  if (watcherInitialized) return;
  watcherInitialized = true;

  const paths = WATCH_PATHS.map((w) => w.path);

  const watcher = watch(paths, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on("change", (filePath) => {
    const matchedWatch = WATCH_PATHS.find((w) => {
      const baseDir = w.path.split("*")[0].replace(/\/$/, "");
      return filePath.startsWith(baseDir);
    });

    if (matchedWatch) {
      eventBus.emit(matchedWatch.event, { file: filePath });
    }
  });

  watcher.on("add", (filePath) => {
    const matchedWatch = WATCH_PATHS.find((w) => {
      const baseDir = w.path.split("*")[0].replace(/\/$/, "");
      return filePath.startsWith(baseDir);
    });

    if (matchedWatch) {
      eventBus.emit(matchedWatch.event, { file: filePath, action: "add" });
    }
  });

  console.log("[FileWatcher] Watching for changes in ~/clawd/");
}
