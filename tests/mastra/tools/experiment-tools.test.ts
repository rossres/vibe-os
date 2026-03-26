import { describe, it, expect } from "vitest";
import { getDb } from "../../../src/core/db";
import { experiments, experimentVariants, experimentResults } from "../../../src/core/db/schema";
import { eq } from "drizzle-orm";
import { createExperimentFn } from "../../../src/mastra/tools/experiments/create-experiment";
import { addExperimentVariantFn } from "../../../src/mastra/tools/experiments/add-experiment-variant";
import { startExperimentFn } from "../../../src/mastra/tools/experiments/start-experiment";
import { evaluateExperimentFn } from "../../../src/mastra/tools/experiments/evaluate-experiment";

describe("Experiment Tools", () => {
  const db = getDb();

  it("creates an experiment in draft status", async () => {
    const expId = await createExperimentFn({
      surface: "email_subject", hypothesis: "Pain-based subject increases open rate",
      ownerAgent: "growth-lead", primaryMetric: "open_rate", minSampleSize: 1000, vertical: "test-segment-a",
    });
    const result = await db.select().from(experiments).where(eq(experiments.id, expId));
    expect(result[0].status).toBe("draft");
  });

  it("adds variants to an experiment", async () => {
    const expId = await createExperimentFn({
      surface: "landing_page", hypothesis: "Social proof test",
      ownerAgent: "growth-lead", primaryMetric: "conversion_rate", vertical: "test-segment-a",
    });
    await addExperimentVariantFn({ experimentId: expId, variantKey: "A", contentRef: "c-1" });
    await addExperimentVariantFn({ experimentId: expId, variantKey: "B", contentRef: "c-2" });
    const variants = await db.select().from(experimentVariants).where(eq(experimentVariants.experimentId, expId));
    expect(variants).toHaveLength(2);
  });

  it("starts an experiment (draft → running)", async () => {
    const expId = await createExperimentFn({
      surface: "sms", hypothesis: "Shorter SMS test",
      ownerAgent: "growth-lead", primaryMetric: "reply_rate", vertical: "test-segment-a",
    });
    await startExperimentFn(expId);
    const result = await db.select().from(experiments).where(eq(experiments.id, expId));
    expect(result[0].status).toBe("running");
    expect(result[0].startedAt).not.toBeNull();
  });

  it("evaluates — insufficient data when no results", async () => {
    const expId = await createExperimentFn({
      surface: "email_body", hypothesis: "Test", ownerAgent: "growth-lead",
      primaryMetric: "conversion_rate", minSampleSize: 1000, vertical: "test-segment-a",
    });
    const decision = await evaluateExperimentFn(expId);
    expect(decision.decision).toBe("insufficient_data");
  });

  it("evaluates — finds winner when thresholds met", async () => {
    const expId = await createExperimentFn({
      surface: "cta", hypothesis: "CTA test", ownerAgent: "growth-lead",
      primaryMetric: "conversion_rate", minSampleSize: 100, vertical: "test-segment-a",
    });
    const varAId = await addExperimentVariantFn({ experimentId: expId, variantKey: "A" });
    const varBId = await addExperimentVariantFn({ experimentId: expId, variantKey: "B" });
    await db.insert(experimentResults).values({
      id: crypto.randomUUID(), experimentId: expId, variantId: varAId,
      impressions: 500, visits: 500, conversions: 50, conversionRate: 0.10, updatedAt: new Date().toISOString(),
    });
    await db.insert(experimentResults).values({
      id: crypto.randomUUID(), experimentId: expId, variantId: varBId,
      impressions: 500, visits: 500, conversions: 25, conversionRate: 0.05, updatedAt: new Date().toISOString(),
    });
    const decision = await evaluateExperimentFn(expId);
    expect(decision.decision).toBe("winner_found");
    expect(decision.winnerVariantId).toBe(varAId);
  });
});
