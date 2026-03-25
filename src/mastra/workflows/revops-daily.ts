import { loadCharter, logActivity, readInbox } from "./helpers";
import { getDb } from "../../core/db";
import { verticalPerformanceDaily, outreachEvents, accounts, stageTransitions } from "../../core/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { createAgentTaskFn } from "../tools/shared/create-agent-task";

export async function revopsDaily() {
  const charter = await loadCharter();
  if (!charter) throw new Error("No active system charter — run Phase 0 first");
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const actions: unknown[] = [];
  const inbox = await readInbox("revops");
  actions.push({ action: "read_inbox", tasks_found: inbox.length });

  const verticals = [charter.verticals.primary, ...charter.verticals.shadow];

  for (const vertical of verticals) {
    // Count accounts identified
    const accountCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(eq(accounts.vertical, vertical));

    // Count outreach sent today
    const outreachSentToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(outreachEvents)
      .where(and(gte(outreachEvents.sentAt, today)));

    // Count replies today (outcome = 'replied')
    const repliesToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(outreachEvents)
      .where(and(
        gte(outreachEvents.sentAt, today),
        eq(outreachEvents.outcome, "replied"),
      ));

    // Count new customers today
    const customersToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(and(
        eq(accounts.vertical, vertical),
        gte(accounts.customerAt, today),
      ));

    // Count stage transitions today
    const transitionsToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(stageTransitions)
      .where(gte(stageTransitions.transitionedAt, today));

    // Compute rates
    const sent = Number(outreachSentToday[0]?.count ?? 0);
    const replies = Number(repliesToday[0]?.count ?? 0);
    const customers = Number(customersToday[0]?.count ?? 0);
    const replyRate = sent > 0 ? replies / sent : null;
    const conversionRate = sent > 0 ? customers / sent : null;

    // Compute 7-day totals for CPA
    const weekOutreach = await db
      .select({ count: sql<number>`count(*)` })
      .from(outreachEvents)
      .where(gte(outreachEvents.sentAt, sevenDaysAgo));
    const weekCustomers = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(and(
        eq(accounts.vertical, vertical),
        gte(accounts.customerAt, sevenDaysAgo),
      ));
    const weekSent = Number(weekOutreach[0]?.count ?? 0);
    const weekCust = Number(weekCustomers[0]?.count ?? 0);

    await db.insert(verticalPerformanceDaily).values({
      id: crypto.randomUUID(),
      performanceDate: today,
      vertical,
      accountsIdentified: Number(accountCount[0]?.count ?? 0),
      outreachSent: sent,
      replies,
      customers,
      conversionRate,
      sampleSize: weekSent,
      createdAt: new Date().toISOString(),
    });

    actions.push({
      action: "snapshot_vertical",
      vertical,
      date: today,
      accounts: Number(accountCount[0]?.count ?? 0),
      outreach_sent: sent,
      replies,
      customers,
      reply_rate: replyRate,
      conversion_rate: conversionRate,
      week_sample_size: weekSent,
    });
  }

  // Generate summary report for COO
  const totalSent = actions
    .filter((a: any) => a.action === "snapshot_vertical")
    .reduce((sum: number, a: any) => sum + (a.outreach_sent ?? 0), 0);
  const totalReplies = actions
    .filter((a: any) => a.action === "snapshot_vertical")
    .reduce((sum: number, a: any) => sum + (a.replies ?? 0), 0);
  const totalCustomers = actions
    .filter((a: any) => a.action === "snapshot_vertical")
    .reduce((sum: number, a: any) => sum + (a.customers ?? 0), 0);

  await createAgentTaskFn({
    fromAgent: "revops",
    toAgent: "ai-coo-lite",
    taskType: "daily_report",
    priority: "normal",
    payload: {
      date: today,
      outreach_sent: totalSent,
      replies: totalReplies,
      customers: totalCustomers,
      reply_rate: totalSent > 0 ? totalReplies / totalSent : 0,
      verticals: actions.filter((a: any) => a.action === "snapshot_vertical"),
    },
  });

  await logActivity("revops", actions, {
    verticals_snapshotted: verticals.length,
    data_sources_pulled: 4,
    total_outreach_today: totalSent,
    total_replies_today: totalReplies,
    total_customers_today: totalCustomers,
  });

  return { verticals_processed: verticals.length, outreach_today: totalSent, replies_today: totalReplies };
}
