// tests/core/schema-accounts-extension.test.ts
import { describe, it, expect } from "vitest";
import { getDb } from "../../src/core/db";
import { accounts, content } from "../../src/core/db/schema";
import { eq } from "drizzle-orm";

describe("Extended account columns", () => {
  const db = getDb();

  it("supports primary_vertical and source_vertical columns", async () => {
    const result = await db.insert(accounts).values({
      name: `Test Med Spa ${crypto.randomUUID().slice(0, 8)}`,
      vertical: "med-spa",
      primaryVertical: "med-spa",
      sourceVertical: "med-spa",
      stage: "identified",
    }).returning();
    expect(result[0].primaryVertical).toBe("med-spa");
    expect(result[0].sourceVertical).toBe("med-spa");
  });

  it("supports last_outreach_at, qualified_at, customer_at columns", async () => {
    const now = new Date().toISOString();
    const result = await db.insert(accounts).values({
      name: `Test Spa ${crypto.randomUUID().slice(0, 8)}`,
      vertical: "med-spa",
      lastOutreachAt: now,
    }).returning();
    expect(result[0].lastOutreachAt).toBe(now);
    expect(result[0].qualifiedAt).toBeNull();
    expect(result[0].customerAt).toBeNull();
  });
});

describe("Extended content columns", () => {
  const db = getDb();

  it("supports approved_for_use and experiment_id columns", async () => {
    const hash = crypto.randomUUID();
    const result = await db.insert(content).values({
      type: "cold_email",
      body: "Test email body",
      approvedForUse: 0,
      experimentId: "exp-123",
      contentHash: hash,
    }).returning();
    expect(result[0].approvedForUse).toBe(0);
    expect(result[0].experimentId).toBe("exp-123");
    expect(result[0].contentHash).toBe(hash);
  });
});
