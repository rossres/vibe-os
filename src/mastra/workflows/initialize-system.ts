import { saveSystemCharterFn } from "../tools/setup/save-system-charter";
import { getDb } from "../../core/db";
import { ceoDirectives } from "../../core/db/schema";
import type { SystemCharter } from "../../core/types/marketing-engine";

export async function initializeSystem(charter: SystemCharter, createdBy: string) {
  validateCharter(charter);
  const totalAllocation = Object.values(charter.verticals.allocation).reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalAllocation - 1.0) > 0.01) throw new Error(`Allocation weights must sum to 1.0, got ${totalAllocation}`);
  if (charter.verticals.shadow.length > 2) throw new Error(`Maximum 2 shadow verticals allowed, got ${charter.verticals.shadow.length}`);

  const result = await saveSystemCharterFn({ charter, createdBy });

  const now = new Date();
  const dueDate = new Date(now.getTime() + charter.primaryGoal.timelineDays * 86400000);

  const db = getDb();
  await db.insert(ceoDirectives).values({
    id: crypto.randomUUID(), horizon: "quarterly",
    title: `${charter.primaryGoal.metric}: ${charter.primaryGoal.target} in ${charter.primaryGoal.timelineDays} days`,
    description: charter.vision.quarterlyRock,
    measurableTarget: String(charter.primaryGoal.target), currentValue: "0",
    targetValue: String(charter.primaryGoal.target), ownerAgent: "ai-coo-lite",
    dueDate: dueDate.toISOString().split("T")[0],
    status: "active", createdAt: now.toISOString(), updatedAt: now.toISOString(),
  });
  return result;
}

function validateCharter(charter: SystemCharter) {
  if (!charter.vision?.bhag) throw new Error("Missing BHAG");
  if (!charter.vision?.purpose) throw new Error("Missing purpose");
  if (!charter.vision?.quarterlyRock) throw new Error("Missing quarterly rock");
  if (!charter.primaryGoal?.metric) throw new Error("Missing primary metric");
  if (!charter.primaryGoal?.target) throw new Error("Missing target value");
  if (!charter.verticals?.primary) throw new Error("Missing primary vertical");
  if (!charter.icp?.signals?.length) throw new Error("Missing ICP signals");
  if (!charter.messaging?.cta) throw new Error("Missing CTA");
  if (!charter.messaging?.allowedClaims?.length) throw new Error("Missing allowed claims");
  if (!charter.messaging?.forbiddenClaims?.length) throw new Error("Missing forbidden claims");
}
