import { describe, it, expect } from "vitest";
import { getDb } from "../../src/core/db";
import {
  systemCharter,
  ceoDirectives,
  agentTasks,
  agentActivity,
  experiments,
  experimentVariants,
  experimentResults,
  verticalPerformanceDaily,
  outreachEvents,
} from "../../src/core/db/schema";
import { eq } from "drizzle-orm";

describe("Marketing Engine Schema Extensions", () => {
  const db = getDb();

  describe("system_charter table", () => {
    it("inserts and retrieves a system charter", async () => {
      const testId = crypto.randomUUID();
      const charter = {
        id: testId,
        version: 1,
        phase: "phase_1_prove_vertical",
        charterData: JSON.stringify({ primaryGoal: { metric: "customers_acquired", target: 50 } }),
        isActive: 1,
        createdBy: "ceo",
        createdAt: new Date().toISOString(),
        supersededAt: null,
      };
      await db.insert(systemCharter).values(charter);
      const result = await db.select().from(systemCharter).where(eq(systemCharter.id, testId));
      expect(result).toHaveLength(1);
      expect(result[0].phase).toBe("phase_1_prove_vertical");
      expect(result[0].isActive).toBe(1);
    });
  });

  describe("ceo_directives table", () => {
    it("inserts and retrieves a directive", async () => {
      const testId = crypto.randomUUID();
      const directive = {
        id: testId,
        horizon: "quarterly",
        title: "Acquire 50 customers in primary segment",
        measurableTarget: "50",
        currentValue: "0",
        targetValue: "50",
        ownerAgent: "ai-coo-lite",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert(ceoDirectives).values(directive);
      const result = await db.select().from(ceoDirectives).where(eq(ceoDirectives.id, testId));
      expect(result).toHaveLength(1);
      expect(result[0].horizon).toBe("quarterly");
    });
  });

  describe("agent_tasks table", () => {
    it("inserts and retrieves an agent task", async () => {
      const testId = crypto.randomUUID();
      const task = {
        id: testId,
        fromAgent: "ai-coo-lite",
        toAgent: "content-director",
        taskType: "content_request",
        priority: "normal",
        payload: JSON.stringify({ type: "cold_email", vertical: "test-segment-a" }),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      await db.insert(agentTasks).values(task);
      const result = await db.select().from(agentTasks).where(eq(agentTasks.id, testId));
      expect(result).toHaveLength(1);
      expect(result[0].fromAgent).toBe("ai-coo-lite");
      expect(result[0].status).toBe("pending");
    });
  });

  describe("agent_activity table", () => {
    it("inserts and retrieves agent activity", async () => {
      const testId = crypto.randomUUID();
      const activity = {
        id: testId,
        agent: "ai-sdr",
        activityDate: "2026-03-23",
        actionsTaken: JSON.stringify([{ action: "send_email", target: "account-1", result: "sent" }]),
        metrics: JSON.stringify({ emails_sent: 23, replies_received: 4 }),
        createdAt: new Date().toISOString(),
      };
      await db.insert(agentActivity).values(activity);
      const result = await db.select().from(agentActivity).where(eq(agentActivity.id, testId));
      expect(result).toHaveLength(1);
      expect(result[0].agent).toBe("ai-sdr");
    });
  });
});

describe("Experiment tables", () => {
  const db = getDb();

  it("creates an experiment with variants and results", async () => {
    const expId = crypto.randomUUID();
    const varAId = crypto.randomUUID();
    const varBId = crypto.randomUUID();
    const resultId = crypto.randomUUID();

    await db.insert(experiments).values({
      id: expId,
      surface: "email_subject",
      hypothesis: "pain-based subject line increases open rate",
      ownerAgent: "growth-lead",
      primaryMetric: "open_rate",
      minSampleSize: 1000,
      vertical: "test-segment-a",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.insert(experimentVariants).values({
      id: varAId,
      experimentId: expId,
      variantKey: "A",
      contentRef: "content-123",
      createdAt: new Date().toISOString(),
    });
    await db.insert(experimentVariants).values({
      id: varBId,
      experimentId: expId,
      variantKey: "B",
      contentRef: "content-456",
      createdAt: new Date().toISOString(),
    });

    await db.insert(experimentResults).values({
      id: resultId,
      experimentId: expId,
      variantId: varAId,
      impressions: 500,
      sends: 500,
      conversions: 25,
      conversionRate: 0.05,
      updatedAt: new Date().toISOString(),
    });

    const exp = await db.select().from(experiments).where(eq(experiments.id, expId));
    expect(exp).toHaveLength(1);
    expect(exp[0].hypothesis).toBe("pain-based subject line increases open rate");

    const variants = await db.select().from(experimentVariants).where(eq(experimentVariants.experimentId, expId));
    expect(variants).toHaveLength(2);

    const results = await db.select().from(experimentResults).where(eq(experimentResults.experimentId, expId));
    expect(results).toHaveLength(1);
    expect(results[0].conversionRate).toBe(0.05);
  });
});

describe("Operational tables", () => {
  const db = getDb();

  it("inserts daily vertical performance snapshot", async () => {
    const testId = crypto.randomUUID();
    await db.insert(verticalPerformanceDaily).values({
      id: testId,
      performanceDate: "2026-03-23",
      vertical: "test-segment-a",
      accountsIdentified: 50,
      outreachSent: 23,
      replies: 4,
      meetings: 1,
      customers: 0,
      spend: 150.0,
      conversionRate: 0.0,
      sampleSize: 23,
      createdAt: new Date().toISOString(),
    });
    const result = await db.select().from(verticalPerformanceDaily).where(eq(verticalPerformanceDaily.id, testId));
    expect(result).toHaveLength(1);
    expect(result[0].outreachSent).toBe(23);
  });

  it("inserts outreach event with dedupe fields", async () => {
    const testId = crypto.randomUUID();
    await db.insert(outreachEvents).values({
      id: testId,
      accountId: 1,
      channel: "email",
      templateId: "template-1",
      messageHash: "abc123",
      deliveryStatus: "sent",
      sentAt: new Date().toISOString(),
    });
    const result = await db.select().from(outreachEvents).where(eq(outreachEvents.id, testId));
    expect(result).toHaveLength(1);
    expect(result[0].channel).toBe("email");
    expect(result[0].messageHash).toBe("abc123");
  });
});
