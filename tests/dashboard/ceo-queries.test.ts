import { describe, it, expect } from "vitest";
import { getDb } from "../../src/core/db";
import { systemCharter, agentTasks } from "../../src/core/db/schema";
import { initializeSystem } from "../../src/mastra/workflows/initialize-system";
import { logAgentActivityFn } from "../../src/mastra/tools/shared/log-agent-activity";
import { getGoalProgress, getTodayNumbers, getAgentHealth, getActiveExperiments, getEscalations } from "../../src/dashboard/ceo-queries";
import type { SystemCharter } from "../../src/core/types/marketing-engine";

const testCharter: SystemCharter = {
  phase: "phase_1_prove_vertical",
  primaryGoal: { metric: "customers_acquired", target: 50, timelineDays: 90 },
  verticals: { primary: "med-spa", shadow: ["dental"], allocation: { "med-spa": 0.85, "dental": 0.15 } },
  icp: { signals: ["missed_call_review"], disqualifiers: ["low_call_volume"] },
  messaging: { canonicalPositioning: "AI front desk", canonicalOffer: "claim it", allowedClaims: ["never miss"], forbiddenClaims: ["replaces staff"], cta: "Claim your number" },
  channels: { active: ["email"], restricted: ["cold_call"], expansionOrder: ["sms"], callsAllowed: false, smsAllowed: true },
  testing: { minSampleSizeLandingPage: 1000, minSendsOutbound: 100, minSpendPaid: 300, confidenceRequired: true, testAggressiveness: "medium", oneTestSurfaceAtATime: true },
  autonomy: { cooCanPauseCampaigns: true, cooCanReduceSendVolume: true, cooCanReallocateBudget: true, maxChannelReallocationPct: 0.2, actionsRequiringCeoApproval: ["change_primary_vertical"] },
};

describe("CEO Dashboard Queries", () => {
  const db = getDb();

  it("getGoalProgress returns progress from directives", async () => {
    await db.update(systemCharter).set({ isActive: 0, supersededAt: new Date().toISOString() });
    await initializeSystem(testCharter, "test");
    const progress = await getGoalProgress();
    expect(progress.target).toBe(50);
    expect(progress.current).toBe(0);
    expect(progress.pct).toBe(0);
  });

  it("getTodayNumbers returns metrics", async () => {
    const numbers = await getTodayNumbers();
    expect(typeof numbers.outreach).toBe("number");
    expect(typeof numbers.pipeline).toBe("number");
  });

  it("getAgentHealth returns 5 agents", async () => {
    await logAgentActivityFn({ agent: "revops", activityDate: new Date().toISOString().split("T")[0], actionsTaken: [{ action: "test" }] });
    const health = await getAgentHealth();
    expect(health.length).toBe(5);
    expect(health.find((h) => h.agent === "revops")?.ran).toBe(true);
  });

  it("getActiveExperiments returns array", async () => {
    const exps = await getActiveExperiments();
    expect(Array.isArray(exps)).toBe(true);
  });

  it("getEscalations returns pending CEO tasks", async () => {
    await db.insert(agentTasks).values({
      id: crypto.randomUUID(), fromAgent: "ai-coo-lite", toAgent: "ceo",
      taskType: "escalation", priority: "high",
      payload: JSON.stringify({ description: "Budget threshold" }),
      status: "pending", createdAt: new Date().toISOString(),
    });
    const escalations = await getEscalations();
    expect(escalations.length).toBeGreaterThanOrEqual(1);
  });
});
