import { getDb } from "../core/db";
import { ceoDirectives, agentActivity, agentTasks, experiments, experimentResults, verticalPerformanceDaily, outreachEvents, accounts, contacts } from "../core/db/schema";
import { eq, and, gte, desc, sql, isNotNull } from "drizzle-orm";

export async function getGoalProgress() {
  const db = getDb();
  const directives = await db.select().from(ceoDirectives)
    .where(eq(ceoDirectives.status, "active")).orderBy(desc(ceoDirectives.createdAt)).limit(1);
  if (directives.length === 0) return { target: 0, current: 0, pct: 0, title: "No active goal", status: "no_goal" as const };
  const d = directives[0];
  const current = Number(d.currentValue ?? 0);
  const target = Number(d.targetValue ?? 0);
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;
  let status: "on_track" | "behind" | "ahead" | "at_risk" | "no_goal" = "on_track";
  if (pct >= 100) status = "ahead";
  else if (pct < 25) status = "at_risk";
  else if (pct < 50) status = "behind";
  return { target, current, pct, title: d.title, status };
}

export async function getTodayNumbers() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const outreach = await db.select({ count: sql<number>`count(*)` }).from(outreachEvents).where(gte(outreachEvents.sentAt, today));
  const pipeline = await db.select({ count: sql<number>`count(*)` }).from(accounts).where(sql`${accounts.stage} NOT IN ('churned', 'paused')`);
  return { outreach: Number(outreach[0]?.count ?? 0), pipeline: Number(pipeline[0]?.count ?? 0), replies: 0, customers: 0 };
}

export async function getAgentHealth() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const agents = ["ai-coo-lite", "revops", "ai-sdr", "content-director", "growth-lead"];
  return Promise.all(agents.map(async (agent) => {
    const activity = await db.select().from(agentActivity)
      .where(and(eq(agentActivity.agent, agent), eq(agentActivity.activityDate, today)))
      .orderBy(desc(agentActivity.createdAt)).limit(1);
    return { agent, ran: activity.length > 0, metrics: activity[0]?.metrics ? JSON.parse(activity[0].metrics) : null, blockers: activity[0]?.blockers ? JSON.parse(activity[0].blockers) : [] };
  }));
}

export async function getActiveExperiments() {
  const db = getDb();
  const running = await db.select().from(experiments).where(eq(experiments.status, "running"));
  return Promise.all(running.map(async (exp) => {
    const results = await db.select().from(experimentResults).where(eq(experimentResults.experimentId, exp.id));
    return { ...exp, results };
  }));
}

export async function getEscalations() {
  const db = getDb();
  return db.select().from(agentTasks).where(and(eq(agentTasks.toAgent, "ceo"), eq(agentTasks.status, "pending"))).orderBy(desc(agentTasks.createdAt));
}

export async function getVerticalBreakdown() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  return db.select().from(verticalPerformanceDaily).where(eq(verticalPerformanceDaily.performanceDate, today));
}

export async function getCooActions() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const activity = await db.select().from(agentActivity)
    .where(and(eq(agentActivity.agent, "ai-coo-lite"), eq(agentActivity.activityDate, today)))
    .orderBy(desc(agentActivity.createdAt)).limit(1);
  if (activity.length === 0) return { actions: [], metrics: null };
  return { actions: JSON.parse(activity[0].actionsTaken), metrics: activity[0].metrics ? JSON.parse(activity[0].metrics) : null };
}

/**
 * LinkedIn tee-ups: high-value contacts with LinkedIn profiles
 * that the CEO should personally connect with today.
 * Prioritizes: decision makers at tier 1 accounts, recently enriched.
 */
export async function getLinkedInTeeUps(limit = 10) {
  const db = getDb();
  const rows = await db
    .select({
      contactName: contacts.name,
      contactRole: contacts.role,
      linkedinUrl: contacts.linkedinUrl,
      email: contacts.email,
      accountName: accounts.name,
      accountVertical: accounts.vertical,
      accountCity: accounts.city,
      accountState: accounts.state,
      totalScore: accounts.totalScore,
      tier: accounts.tier,
    })
    .from(contacts)
    .innerJoin(accounts, eq(contacts.accountId, accounts.id))
    .where(
      and(
        isNotNull(contacts.linkedinUrl),
        sql`${contacts.linkedinUrl} != ''`,
        eq(contacts.isDecisionMaker, true),
      ),
    )
    .orderBy(desc(accounts.totalScore))
    .limit(limit);

  return rows;
}
