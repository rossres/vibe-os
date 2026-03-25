import { describe, it, expect } from "vitest";
import { getDb } from "../../../src/core/db";
import { systemCharter, agentTasks, agentActivity } from "../../../src/core/db/schema";
import { eq } from "drizzle-orm";
import { getActiveCharterFn } from "../../../src/mastra/tools/shared/get-active-system-charter";
import { createAgentTaskFn } from "../../../src/mastra/tools/shared/create-agent-task";
import { readAgentInboxFn } from "../../../src/mastra/tools/shared/read-agent-inbox";
import { logAgentActivityFn } from "../../../src/mastra/tools/shared/log-agent-activity";

describe("Shared Tools", () => {
  const db = getDb();

  describe("getActiveCharterFn", () => {
    it("returns the active charter after one is created", async () => {
      // Deactivate any existing active charters so this insert wins
      await db.update(systemCharter).set({ isActive: 0, supersededAt: new Date().toISOString() });
      const id = crypto.randomUUID();
      await db.insert(systemCharter).values({
        id, version: 1, phase: "phase_1_prove_vertical",
        charterData: JSON.stringify({ phase: "phase_1_prove_vertical", primaryGoal: { metric: "customers_acquired", target: 50, timelineDays: 90 } }),
        isActive: 1, createdBy: "test", createdAt: new Date().toISOString(),
      });
      const result = await getActiveCharterFn();
      expect(result).not.toBeNull();
      expect(result!.phase).toBe("phase_1_prove_vertical");
      expect(result!.charter.primaryGoal.target).toBe(50);
    });
  });

  describe("createAgentTaskFn", () => {
    it("creates a task in the agent_tasks table", async () => {
      const taskId = await createAgentTaskFn({
        fromAgent: "ai-coo-lite", toAgent: "content-director",
        taskType: "content_request", priority: "high",
        payload: { type: "cold_email", vertical: "med-spa" },
      });
      expect(taskId).toBeDefined();
      const result = await db.select().from(agentTasks).where(eq(agentTasks.id, taskId));
      expect(result).toHaveLength(1);
      expect(result[0].fromAgent).toBe("ai-coo-lite");
      expect(result[0].status).toBe("pending");
    });
  });

  describe("readAgentInboxFn", () => {
    it("returns pending tasks for a specific agent", async () => {
      await createAgentTaskFn({
        fromAgent: "ai-coo-lite", toAgent: "ai-sdr",
        taskType: "outreach_request", payload: { message: "send more emails" },
      });
      const tasks = await readAgentInboxFn("ai-sdr");
      expect(tasks.length).toBeGreaterThanOrEqual(1);
      expect(tasks.every((t) => t.toAgent === "ai-sdr")).toBe(true);
      expect(tasks.every((t) => t.status === "pending")).toBe(true);
    });
  });

  describe("logAgentActivityFn", () => {
    it("logs daily activity for an agent", async () => {
      const ok = await logAgentActivityFn({
        agent: "revops", activityDate: "2026-03-23",
        actionsTaken: [{ action: "pull_metrics", result: "success" }],
        metrics: { accounts_scored: 147 },
      });
      expect(ok).toBe(true);
      const result = await db.select().from(agentActivity).where(eq(agentActivity.agent, "revops"));
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
