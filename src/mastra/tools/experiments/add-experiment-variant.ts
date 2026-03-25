import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { experimentVariants } from "../../../core/db/schema";

export async function addExperimentVariantFn(input: {
  experimentId: string; variantKey: string; contentRef?: string; metadata?: unknown;
}) {
  const db = getDb();
  const variantId = crypto.randomUUID();
  await db.insert(experimentVariants).values({
    id: variantId, experimentId: input.experimentId, variantKey: input.variantKey,
    contentRef: input.contentRef ?? null, metadata: JSON.stringify(input.metadata ?? {}),
    createdAt: new Date().toISOString(),
  });
  return variantId;
}

export const addExperimentVariant = createTool({
  id: "add-experiment-variant",
  description: "Attach a variant to an experiment.",
  inputSchema: z.object({
    experimentId: z.string(), variantKey: z.string(),
    contentRef: z.string().optional(), metadata: z.any().optional(),
  }),
  outputSchema: z.object({ variantId: z.string() }),
  execute: async (args: any) => ({ variantId: await addExperimentVariantFn(args.context ?? args) }),
});
