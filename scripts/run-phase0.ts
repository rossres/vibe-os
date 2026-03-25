/**
 * Phase 0 — System Setup / System Initialization
 *
 * Persists the founder-defined system charter and creates the initial CEO directive.
 * Run: npx tsx scripts/run-phase0.ts
 *
 * IMPORTANT: Edit the charter below with YOUR business details before running.
 */
import "dotenv/config";
import { initializeSystem } from "../src/mastra/workflows/initialize-system";
import type { SystemCharter } from "../src/core/types/marketing-engine";

const charter: SystemCharter = {
  phase: "phase_1_prove_vertical",

  // ── Vision (Vision hierarchy) ──────────────────────────────
  vision: {
    bhag: "YOUR BIG HAIRY AUDACIOUS GOAL HERE",
    purpose: "WHY YOUR BUSINESS EXISTS",
    threeYearPicture: "WHERE YOU WANT TO BE IN 3 YEARS",
    oneYearRocks: [
      "ROCK 1 — your most important annual goal",
      "ROCK 2",
      "ROCK 3",
    ],
    quarterlyRock: "YOUR Q1 GOAL — the one number that matters this quarter",
  },

  // ── Primary goal ────────────────────────────────────────
  primaryGoal: {
    metric: "customers_acquired",
    target: 50,
    timelineDays: 30,
  },

  // ── Verticals ───────────────────────────────────────────
  verticals: {
    primary: "YOUR-PRIMARY-VERTICAL",
    shadow: ["shadow-vertical-1", "shadow-vertical-2"],
    allocation: {
      "YOUR-PRIMARY-VERTICAL": 0.7,
      "shadow-vertical-1": 0.15,
      "shadow-vertical-2": 0.15,
    },
  },

  // ── ICP ─────────────────────────────────────────────────
  icp: {
    businessTypes: ["YOUR-PRIMARY-VERTICAL"],
    signals: [
      "Signal that indicates they need your product",
      "Another buying signal",
    ],
    disqualifiers: [
      "Reason someone is NOT a fit",
    ],
    employeeRange: [1, 50],
  },

  // ── Messaging guardrails ────────────────────────────────
  messaging: {
    canonicalPositioning: "YOUR ONE-LINE CATEGORY POSITIONING",
    canonicalOffer: "YOUR PRIMARY OFFER",
    allowedClaims: [
      "Claim you can truthfully make",
      "Another truthful claim",
    ],
    forbiddenClaims: [
      "Claim you must NOT make",
    ],
    cta: "Your primary call-to-action",
  },

  // ── Channels ────────────────────────────────────────────
  channels: {
    active: ["email", "landing_page"],
    restricted: ["cold_call"],
    expansionOrder: ["paid_social", "sms"],
    callsAllowed: false,
    smsAllowed: false,
  },

  // ── Budget ──────────────────────────────────────────────
  budget: {
    dailyLimit: 100,
    weeklyLimit: 500,
    maxDailyOutreachSends: 100,
    maxDailySms: 0,
    maxDailyCalls: 0,
  },

  // ── Testing ─────────────────────────────────────────────
  testing: {
    minSampleSizeLandingPage: 500,
    minSendsOutbound: 50,
    minSpendPaid: 150,
    confidenceRequired: true,
    testAggressiveness: "medium",
    oneTestSurfaceAtATime: false,
  },

  // ── Autonomy ────────────────────────────────────────────
  autonomy: {
    cooCanPauseCampaigns: true,
    cooCanReduceSendVolume: true,
    cooCanReallocateBudget: true,
    maxChannelReallocationPct: 0.2,
    actionsRequiringCeoApproval: [
      "change_primary_vertical",
      "change_canonical_positioning",
      "increase_total_budget_above_weekly_cap",
      "add_new_paid_channel",
    ],
  },
};

async function main() {
  console.log("Phase 0 — System Initialization\n");
  console.log(`BHAG: ${charter.vision.bhag}`);
  console.log(`Primary vertical: ${charter.verticals.primary}`);
  console.log(
    `Goal: ${charter.primaryGoal.target} ${charter.primaryGoal.metric} in ${charter.primaryGoal.timelineDays} days`,
  );
  console.log(
    `Budget: $${charter.budget.dailyLimit}/day, $${charter.budget.weeklyLimit}/week`,
  );
  console.log("");

  const result = await initializeSystem(charter, "ceo");

  console.log("Charter persisted");
  console.log(`  Charter ID: ${result.charterId}`);
  console.log(`  Version: ${result.version}`);
  console.log("");
  console.log("CEO directive created");
  console.log(
    `  ${charter.primaryGoal.metric}: ${charter.primaryGoal.target} in ${charter.primaryGoal.timelineDays} days`,
  );
  console.log("");
  console.log("Phase 0 complete. System is ready for Phase 1 execution.");
}

main().catch((err) => {
  console.error("Phase 0 failed:", err);
  process.exit(1);
});
