import { describe, it, expect } from "vitest";
import { getDb } from "../../../src/core/db";
import { systemCharter, ceoDirectives, agentActivity, verticalPerformanceDaily, experiments } from "../../../src/core/db/schema";
import { eq } from "drizzle-orm";
import { initializeSystem } from "../../../src/mastra/workflows/initialize-system";
import { revopsDaily } from "../../../src/mastra/workflows/revops-daily";
import { cooDaily } from "../../../src/mastra/workflows/coo-daily";
import { evaluateExperimentsDaily } from "../../../src/mastra/workflows/evaluate-experiments";
import type { SystemCharter } from "../../../src/core/types/marketing-engine";

const testCharter: SystemCharter = {
  phase: "phase_1_prove_vertical",
  primaryGoal: { metric: "customers_acquired", target: 50, timelineDays: 90 },
  verticals: { primary: "med-spa", shadow: ["dental"], allocation: { "med-spa": 0.85, "dental": 0.15 } },
  icp: { signals: ["missed_call_review"], disqualifiers: ["low_call_volume"] },
  messaging: {
    canonicalPositioning: "AI front desk for local businesses",
    canonicalOffer: "We already assigned you a number — claim it",
    allowedClaims: ["never miss a customer"],
    forbiddenClaims: ["fully replaces your staff"],
    cta: "Claim your number",
  },
  channels: { active: ["email"], restricted: ["cold_call"], expansionOrder: ["sms"], callsAllowed: false, smsAllowed: true },
  testing: { minSampleSizeLandingPage: 1000, minSendsOutbound: 100, minSpendPaid: 300, confidenceRequired: true, testAggressiveness: "medium", oneTestSurfaceAtATime: true },
  autonomy: { cooCanPauseCampaigns: true, cooCanReduceSendVolume: true, cooCanReallocateBudget: true, maxChannelReallocationPct: 0.2, actionsRequiringCeoApproval: ["change_primary_vertical"] },
};

async function setupCharter() {
  const db = getDb();
  await db.update(systemCharter).set({ isActive: 0, supersededAt: new Date().toISOString() });
  return await initializeSystem(testCharter, "test");
}

describe("Workflow Definitions", () => {
  describe("initializeSystem", () => {
    it("saves charter and seeds CEO directive", async () => {
      const result = await setupCharter();
      expect(result.charterId).toBeDefined();
      expect(result.version).toBeGreaterThanOrEqual(1);
      const db = getDb();
      const directives = await db.select().from(ceoDirectives).where(eq(ceoDirectives.ownerAgent, "ai-coo-lite"));
      expect(directives.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects allocation not summing to 1.0", async () => {
      const bad = { ...testCharter, verticals: { ...testCharter.verticals, allocation: { "med-spa": 0.5, "dental": 0.1 } } };
      await expect(initializeSystem(bad, "ceo")).rejects.toThrow("Allocation weights must sum to 1.0");
    });

    it("rejects missing primary metric", async () => {
      const bad = { ...testCharter, primaryGoal: { ...testCharter.primaryGoal, metric: "" } };
      await expect(initializeSystem(bad, "ceo")).rejects.toThrow("Missing primary metric");
    });

    it("rejects more than 2 shadow verticals", async () => {
      const bad = { ...testCharter, verticals: { ...testCharter.verticals, shadow: ["dental", "hvac", "plumbing"] as any, allocation: { "med-spa": 0.7, "dental": 0.1, "hvac": 0.1, "plumbing": 0.1 } } };
      await expect(initializeSystem(bad, "ceo")).rejects.toThrow("Maximum 2 shadow verticals");
    });
  });

  describe("revopsDaily", () => {
    it("creates vertical performance snapshots", async () => {
      await setupCharter();
      const result = await revopsDaily();
      expect(result.verticals_processed).toBe(2);
      const db = getDb();
      const activities = await db.select().from(agentActivity).where(eq(agentActivity.agent, "revops"));
      expect(activities.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("cooDaily", () => {
    it("reviews agent activity and checks goals", async () => {
      await setupCharter();
      const result = await cooDaily();
      expect(result.agents_reviewed).toBeDefined();
      expect(result.active_goals).toBeGreaterThanOrEqual(1);
    });
  });

  describe("evaluateExperimentsDaily", () => {
    it("runs without error when no experiments running", async () => {
      await setupCharter();
      // Clear any running experiments left by prior test runs
      const db = getDb();
      await db.update(experiments).set({ status: "ended" }).where(eq(experiments.status, "running"));
      const result = await evaluateExperimentsDaily();
      expect(result.experiments_evaluated).toBe(0);
    });
  });
});
