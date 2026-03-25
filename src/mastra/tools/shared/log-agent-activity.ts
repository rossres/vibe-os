import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { agentActivity } from "../../../core/db/schema";

export async function logAgentActivityFn(input: {
  agent: string; activityDate: string; actionsTaken: unknown[];
  metrics?: unknown; blockers?: unknown[]; requestsMade?: unknown[];
}) {
  const db = getDb();
  await db.insert(agentActivity).values({
    id: crypto.randomUUID(), agent: input.agent, activityDate: input.activityDate,
    actionsTaken: JSON.stringify(input.actionsTaken),
    metrics: JSON.stringify(input.metrics ?? {}),
    blockers: JSON.stringify(input.blockers ?? []),
    requestsMade: JSON.stringify(input.requestsMade ?? []),
    createdAt: new Date().toISOString(),
  });
  return true;
}

export const logAgentActivity = createTool({
  id: "log-agent-activity",
  description: "Write daily activity metrics and blockers for an agent.",
  inputSchema: z.object({
    agent: z.string(), activityDate: z.string(), actionsTaken: z.array(z.any()),
    metrics: z.any().optional(), blockers: z.array(z.any()).optional(),
    requestsMade: z.array(z.any()).optional(),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async (args: any) => {
    const input = args.context ?? args;
    const ok = await logAgentActivityFn(input);
    return { ok };
  },
});
