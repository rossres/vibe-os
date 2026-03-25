import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { agentTasks } from "../../../core/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function readAgentInboxFn(agentId: string) {
  const db = getDb();
  return await db.select().from(agentTasks)
    .where(and(eq(agentTasks.toAgent, agentId), eq(agentTasks.status, "pending")))
    .orderBy(desc(agentTasks.createdAt));
}

export const readAgentInbox = createTool({
  id: "read-agent-inbox",
  description: "Read pending tasks assigned to the current agent.",
  inputSchema: z.object({ agentId: z.string() }),
  outputSchema: z.object({ tasks: z.array(z.any()) }),
  execute: async (args: any) => {
    const input = args.context ?? args;
    const tasks = await readAgentInboxFn(input.agentId);
    return { tasks };
  },
});
