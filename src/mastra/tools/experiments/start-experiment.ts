import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { experiments } from "../../../core/db/schema";
import { eq } from "drizzle-orm";

export async function startExperimentFn(experimentId: string) {
  const db = getDb();
  await db.update(experiments)
    .set({ status: "running", startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(experiments.id, experimentId));
  return true;
}

export const startExperiment = createTool({
  id: "start-experiment", description: "Mark a draft experiment as running.",
  inputSchema: z.object({ experimentId: z.string() }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async (args: any) => { const input = args.context ?? args; return { ok: await startExperimentFn(input.experimentId) }; },
});
