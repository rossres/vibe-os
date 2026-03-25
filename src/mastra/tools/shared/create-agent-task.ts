import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { agentTasks } from "../../../core/db/schema";

export async function createAgentTaskFn(input: {
  fromAgent: string; toAgent: string; taskType: string; priority?: string; payload: unknown;
}) {
  const db = getDb();
  const taskId = crypto.randomUUID();
  await db.insert(agentTasks).values({
    id: taskId, fromAgent: input.fromAgent, toAgent: input.toAgent,
    taskType: input.taskType, priority: input.priority ?? "normal",
    payload: JSON.stringify(input.payload), status: "pending",
    createdAt: new Date().toISOString(),
  });
  return taskId;
}

export const createAgentTask = createTool({
  id: "create-agent-task",
  description: "Create a task for another agent in the shared task queue.",
  inputSchema: z.object({
    fromAgent: z.string(), toAgent: z.string(), taskType: z.string(),
    priority: z.enum(["urgent", "high", "normal", "low"]).default("normal"),
    payload: z.any(),
  }),
  outputSchema: z.object({ taskId: z.string() }),
  execute: async (args: any) => {
    const input = args.context ?? args;
    const taskId = await createAgentTaskFn(input);
    return { taskId };
  },
});
