import { getActiveCharterFn } from "../tools/shared/get-active-system-charter";
import { logAgentActivityFn } from "../tools/shared/log-agent-activity";
import { readAgentInboxFn } from "../tools/shared/read-agent-inbox";
import type { SystemCharter } from "../../core/types/marketing-engine";

export async function loadCharter(): Promise<SystemCharter | null> {
  const result = await getActiveCharterFn();
  return result?.charter ?? null;
}

export async function logActivity(agent: string, actionsTaken: unknown[], metrics?: unknown, blockers?: unknown[]) {
  const today = new Date().toISOString().split("T")[0];
  await logAgentActivityFn({ agent, activityDate: today, actionsTaken, metrics, blockers });
}

export async function readInbox(agentId: string) {
  return await readAgentInboxFn(agentId);
}
