import { describe, it, expect } from "vitest";
import { getDb } from "../../../src/core/db";
import { systemCharter, outreachEvents } from "../../../src/core/db/schema";
import { saveSystemCharterFn } from "../../../src/mastra/tools/setup/save-system-charter";
import { getVerticalAllocationFn } from "../../../src/mastra/tools/policy/get-vertical-allocation";
import { checkOutreachDedupeFn } from "../../../src/mastra/tools/policy/check-outreach-dedupe";

describe("Policy Tools", () => {
  const db = getDb();

  describe("getVerticalAllocationFn", () => {
    it("returns vertical allocation from active charter", async () => {
      await db.update(systemCharter).set({ isActive: 0, supersededAt: new Date().toISOString() });
      await saveSystemCharterFn({
        charter: {
          phase: "phase_1_prove_vertical",
          verticals: { primary: "test-segment-a", shadow: ["test-segment-b"], allocation: { "test-segment-a": 0.85, "test-segment-b": 0.15 } },
        },
        createdBy: "test",
      });
      const result = await getVerticalAllocationFn();
      expect(result.primary).toBe("test-segment-a");
      expect(result.shadow).toEqual(["test-segment-b"]);
      expect(result.allocation["test-segment-a"]).toBe(0.85);
    });
  });

  describe("checkOutreachDedupeFn", () => {
    it("allows outreach when no recent match exists", async () => {
      const result = await checkOutreachDedupeFn({ accountId: 99999, channel: "email", lookbackDays: 14 });
      expect(result.allowed).toBe(true);
    });

    it("blocks outreach when recent match exists", async () => {
      const accountId = 88888;
      await db.insert(outreachEvents).values({
        id: crypto.randomUUID(), accountId, channel: "email",
        messageHash: "same-hash", deliveryStatus: "sent", sentAt: new Date().toISOString(),
      });
      const result = await checkOutreachDedupeFn({ accountId, channel: "email", lookbackDays: 14 });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});
