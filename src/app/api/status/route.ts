import { NextResponse } from "next/server";
import { getTimeTrackerState } from "@/lib/parsers/time-entries";
import { AgentState, AgentStatus } from "@/types";

export const dynamic = "force-dynamic";

function determineAgentState(): AgentStatus {
  const state = getTimeTrackerState();

  if (!state) {
    return {
      state: "sleeping",
      currentActivity: null,
      lastAction: null,
      sessionCount: 0,
    };
  }

  const lastPing = new Date(state.lastPing);
  const minutesSinceLastPing =
    (Date.now() - lastPing.getTime()) / 1000 / 60;

  let agentState: AgentState;
  if (minutesSinceLastPing < 10) {
    agentState = state.focusMode?.active ? "busy" : "active";
  } else if (minutesSinceLastPing < 60) {
    agentState = "idle";
  } else {
    agentState = "sleeping";
  }

  return {
    state: agentState,
    currentActivity: state.currentEntry?.activity || null,
    lastAction: state.lastPing,
    sessionCount: state.currentEntry ? 1 : 0,
  };
}

export async function GET() {
  const status = determineAgentState();
  return NextResponse.json(status);
}
