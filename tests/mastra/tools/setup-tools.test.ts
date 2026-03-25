import { describe, it, expect } from "vitest";
import { getDb } from "../../../src/core/db";
import { systemCharter } from "../../../src/core/db/schema";
import { eq } from "drizzle-orm";
import { saveSystemCharterFn } from "../../../src/mastra/tools/setup/save-system-charter";

describe("saveSystemCharterFn", () => {
  const db = getDb();

  it("creates a new charter with version 1 when none active", async () => {
    // Deactivate any existing
    await db.update(systemCharter).set({ isActive: 0, supersededAt: new Date().toISOString() });
    const result = await saveSystemCharterFn({
      charter: { phase: "phase_1_prove_vertical", primaryGoal: { metric: "customers_acquired", target: 50, timelineDays: 90 } },
      createdBy: "ceo",
    });
    expect(result.version).toBe(1);
    const row = await db.select().from(systemCharter).where(eq(systemCharter.id, result.charterId));
    expect(row[0].isActive).toBe(1);
  });

  it("supersedes old charter and increments version", async () => {
    await db.update(systemCharter).set({ isActive: 0, supersededAt: new Date().toISOString() });
    const first = await saveSystemCharterFn({
      charter: { phase: "phase_1_prove_vertical", primaryGoal: { metric: "test", target: 10, timelineDays: 30 } },
      createdBy: "ceo",
    });
    const second = await saveSystemCharterFn({
      charter: { phase: "phase_1_prove_vertical", primaryGoal: { metric: "test", target: 20, timelineDays: 60 } },
      createdBy: "ceo",
    });
    expect(second.version).toBe(first.version + 1);
    const oldRow = await db.select().from(systemCharter).where(eq(systemCharter.id, first.charterId));
    expect(oldRow[0].isActive).toBe(0);
    expect(oldRow[0].supersededAt).not.toBeNull();
    const newRow = await db.select().from(systemCharter).where(eq(systemCharter.id, second.charterId));
    expect(newRow[0].isActive).toBe(1);
  });
});
