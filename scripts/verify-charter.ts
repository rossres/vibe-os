import "dotenv/config";
import { getDb } from "../src/core/db/index.js";
import { systemCharter, ceoDirectives } from "../src/core/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const db = getDb();
  const charters = await db.select().from(systemCharter).where(eq(systemCharter.isActive, 1));
  const directives = await db.select().from(ceoDirectives).where(eq(ceoDirectives.status, "active"));

  console.log("=== Active Charter (v" + charters[0].version + ") ===");
  const data = JSON.parse(charters[0].charterData as string);
  console.log("Phase:", charters[0].phase);
  console.log("BHAG:", data.vision.bhag);
  console.log("Purpose:", data.vision.purpose);
  console.log("3-Year:", data.vision.threeYearPicture);
  console.log("Q1 Rock:", data.vision.quarterlyRock);
  console.log("Primary:", data.verticals.primary, "(" + (data.verticals.allocation[data.verticals.primary] * 100) + "%)");
  console.log("Shadow:", data.verticals.shadow.join(", "));
  console.log("Goal:", data.primaryGoal.target, data.primaryGoal.metric, "in", data.primaryGoal.timelineDays, "days");
  console.log("ICP signals:", data.icp.signals.length);
  console.log("Active channels:", data.channels.active.join(", "));
  console.log("Budget: $" + data.budget.dailyLimit + "/day");

  console.log("\n=== Active CEO Directive ===");
  console.log("Title:", directives[0].title);
  console.log("Description:", directives[0].description);
  console.log("Due:", directives[0].dueDate);
  console.log("Progress:", directives[0].currentValue, "/", directives[0].targetValue);
  console.log("Owner:", directives[0].ownerAgent);
}

main().catch(console.error);
