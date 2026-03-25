import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { experiments } from "../../../core/db/schema";

export async function createExperimentFn(input: {
  surface: string; hypothesis: string; ownerAgent: string;
  primaryMetric: string; minSampleSize?: number; minSendCount?: number;
  minSpend?: number; vertical: string;
}) {
  const db = getDb();
  const experimentId = crypto.randomUUID();
  await db.insert(experiments).values({
    id: experimentId, surface: input.surface, hypothesis: input.hypothesis,
    ownerAgent: input.ownerAgent, primaryMetric: input.primaryMetric,
    minSampleSize: input.minSampleSize ?? null, minSendCount: input.minSendCount ?? null,
    minSpend: input.minSpend ?? null, vertical: input.vertical, status: "draft",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  return experimentId;
}

export const createExperiment = createTool({
  id: "create-experiment",
  description: "Create a new experiment for landing page or outbound message testing.",
  inputSchema: z.object({
    surface: z.enum(["landing_page", "email_subject", "email_body", "sms", "cta"]),
    hypothesis: z.string(), ownerAgent: z.string(), primaryMetric: z.string(),
    minSampleSize: z.number().optional(), minSendCount: z.number().optional(),
    minSpend: z.number().optional(), vertical: z.string(),
  }),
  outputSchema: z.object({ experimentId: z.string() }),
  execute: async (args: any) => ({ experimentId: await createExperimentFn(args.context ?? args) }),
});
