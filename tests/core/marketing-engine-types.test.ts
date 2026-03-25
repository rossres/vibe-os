import { describe, it, expect } from "vitest";
import type {
  PipelineStage,
  PhaseName,
  ExperimentSurface,
  ExperimentStatus,
  AgentId,
} from "../../src/core/types";
import type { SystemCharter } from "../../src/core/types/marketing-engine";

describe("Marketing Engine Types", () => {
  it("PipelineStage includes post-sale stages", () => {
    const stages: PipelineStage[] = [
      "identified", "aware", "interested", "consider",
      "selecting", "customer", "churned", "paused",
    ];
    expect(stages).toHaveLength(8);
  });

  it("PhaseName covers setup and prove phases", () => {
    const phases: PhaseName[] = ["phase_0_setup", "phase_1_prove_vertical"];
    expect(phases).toHaveLength(2);
  });

  it("ExperimentSurface covers all testable surfaces", () => {
    const surfaces: ExperimentSurface[] = [
      "landing_page", "email_subject", "email_body", "sms", "cta",
    ];
    expect(surfaces).toHaveLength(5);
  });

  it("ExperimentStatus covers full lifecycle", () => {
    const statuses: ExperimentStatus[] = [
      "draft", "running", "won", "lost", "killed", "archived",
    ];
    expect(statuses).toHaveLength(6);
  });

  it("AgentId covers all Phase 1 agents", () => {
    const agents: AgentId[] = [
      "setup-agent", "ai-coo-lite", "revops",
      "ai-sdr", "content-director", "growth-lead",
    ];
    expect(agents).toHaveLength(6);
  });
});

describe("SystemCharter interface", () => {
  it("accepts a valid charter object", () => {
    const charter: SystemCharter = {
      phase: "phase_1_prove_vertical",
      primaryGoal: {
        metric: "customers_acquired",
        target: 50,
        timelineDays: 90,
      },
      verticals: {
        primary: "med-spa",
        shadow: ["dental"],
        allocation: { "med-spa": 0.85, "dental": 0.15 },
      },
      icp: {
        signals: ["missed_call_review", "booking_friction"],
        disqualifiers: ["low_call_volume"],
      },
      messaging: {
        canonicalPositioning: "AI front desk for local businesses",
        canonicalOffer: "We already assigned you a number — claim it",
        allowedClaims: ["never miss a customer"],
        forbiddenClaims: ["fully replaces your staff"],
        cta: "Claim your number",
      },
      channels: {
        active: ["email", "sms", "landing_page"],
        restricted: ["cold_call", "paid_social"],
        expansionOrder: ["sms", "google_search", "voice_call"],
        callsAllowed: false,
        smsAllowed: true,
      },
      testing: {
        minSampleSizeLandingPage: 1000,
        minSendsOutbound: 100,
        minSpendPaid: 300,
        confidenceRequired: true,
        testAggressiveness: "medium",
        oneTestSurfaceAtATime: true,
      },
      autonomy: {
        cooCanPauseCampaigns: true,
        cooCanReduceSendVolume: true,
        cooCanReallocateBudget: true,
        maxChannelReallocationPct: 0.2,
        actionsRequiringCeoApproval: [
          "change_primary_vertical",
          "change_canonical_positioning",
        ],
      },
    };
    expect(charter.primaryGoal.target).toBe(50);
    expect(charter.messaging.cta).toBe("Claim your number");
    expect(charter.verticals.primary).toBe("med-spa");
  });
});
