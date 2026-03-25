import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDb } from "../../../core/db";
import { experiments, experimentResults } from "../../../core/db/schema";
import { eq } from "drizzle-orm";

export async function evaluateExperimentFn(experimentId: string) {
  const db = getDb();
  const expRows = await db.select().from(experiments).where(eq(experiments.id, experimentId));
  const experiment = expRows[0];
  const results = await db.select().from(experimentResults).where(eq(experimentResults.experimentId, experimentId));

  if (!experiment || results.length === 0) {
    return { decision: "insufficient_data" as const, winnerVariantId: null, reason: "No experiment or results found." };
  }

  const thresholdMet = results.some((r) => {
    const sampleOk = experiment.minSampleSize ? (r.visits ?? r.impressions ?? 0) >= experiment.minSampleSize : true;
    const sendsOk = experiment.minSendCount ? (r.sends ?? 0) >= experiment.minSendCount : true;
    const spendOk = experiment.minSpend ? (r.spend ?? 0) >= experiment.minSpend : true;
    return sampleOk && sendsOk && spendOk;
  });

  if (!thresholdMet) {
    return { decision: "insufficient_data" as const, winnerVariantId: null, reason: "Minimum thresholds not met." };
  }

  const sorted = [...results].sort((a, b) => (b.conversionRate ?? 0) - (a.conversionRate ?? 0));
  const best = sorted[0];
  const second = sorted[1];

  if (!best) {
    return { decision: "kill_test" as const, winnerVariantId: null, reason: "No valid variants." };
  }

  const delta = second ? (best.conversionRate ?? 0) - (second.conversionRate ?? 0) : (best.conversionRate ?? 0);
  if (delta > 0.01) {
    return { decision: "winner_found" as const, winnerVariantId: best.variantId, reason: "Best variant exceeded next by >1pp conversion rate." };
  }

  return { decision: "keep_running" as const, winnerVariantId: null, reason: "Thresholds met but no clear winner yet." };
}

export const evaluateExperiment = createTool({
  id: "evaluate-experiment",
  description: "Evaluate an experiment against min thresholds and determine winner.",
  inputSchema: z.object({ experimentId: z.string() }),
  outputSchema: z.object({
    decision: z.enum(["insufficient_data", "keep_running", "winner_found", "kill_test"]),
    winnerVariantId: z.string().nullable(), reason: z.string(),
  }),
  execute: async (args: any) => { const input = args.context ?? args; return await evaluateExperimentFn(input.experimentId); },
});
