import { loadCharter, logActivity } from "./helpers";
import { getDb } from "../../core/db";
import { agentActivity, experiments, ceoDirectives, verticalPerformanceDaily, outreachEvents } from "../../core/db/schema";
import { eq, gte, desc, and, sql } from "drizzle-orm";
import { shouldTriggerCourseCorrection, shouldForceExperiment } from "../rules/enforcement";
import { createAgentTaskFn } from "../tools/shared/create-agent-task";

export async function cooDaily() {
  const charter = await loadCharter();
  if (!charter) throw new Error("No active system charter — run Phase 0 first");
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const actions: unknown[] = [];
  let escalations = 0;
  let autonomousDecisions = 0;

  // ── Load today's agent activity ───────────────────────────
  const todayActivities = await db.select().from(agentActivity).where(eq(agentActivity.activityDate, today));
  actions.push({ action: "load_activities", agents_reporting: todayActivities.length });

  const activeExperiments = await db.select().from(experiments).where(eq(experiments.status, "running"));
  const directives = await db.select().from(ceoDirectives).where(eq(ceoDirectives.status, "active"));

  // ── Check goal progress ───────────────────────────────────
  for (const directive of directives) {
    const current = Number(directive.currentValue ?? 0);
    const target = Number(directive.targetValue ?? 0);
    const dueDate = directive.dueDate ? new Date(directive.dueDate) : null;
    const daysRemaining = dueDate ? Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / 86400000)) : null;

    if (target > 0) {
      const pct = ((current / target) * 100).toFixed(0);
      const neededPerDay = daysRemaining && daysRemaining > 0 ? ((target - current) / daysRemaining).toFixed(1) : "N/A";
      actions.push({
        action: "check_goal",
        title: directive.title,
        progress: `${pct}%`,
        current,
        target,
        days_remaining: daysRemaining,
        needed_per_day: neededPerDay,
      });
    }
  }

  // ── Compute real metrics for enforcement rules ────────────
  // Get last 7 days of vertical performance for primary vertical
  const primaryVertical = charter.verticals.primary;
  const weekPerformance = await db
    .select()
    .from(verticalPerformanceDaily)
    .where(and(
      eq(verticalPerformanceDaily.vertical, primaryVertical),
      gte(verticalPerformanceDaily.performanceDate, sevenDaysAgo),
    ))
    .orderBy(desc(verticalPerformanceDaily.performanceDate));

  // Today's outreach for primary vertical
  const todayOutreach = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachEvents)
    .where(gte(outreachEvents.sentAt, today));
  const activityToday = Number(todayOutreach[0]?.count ?? 0);

  // Today's results (replies)
  const todayReplies = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachEvents)
    .where(and(
      gte(outreachEvents.sentAt, today),
      eq(outreachEvents.outcome, "replied"),
    ));
  const resultToday = Number(todayReplies[0]?.count ?? 0);

  // 7-day averages
  const activity7DayAvg = weekPerformance.length > 0
    ? weekPerformance.reduce((sum, d) => sum + (d.outreachSent ?? 0), 0) / weekPerformance.length
    : 0;
  const result7DayAvg = weekPerformance.length > 0
    ? weekPerformance.reduce((sum, d) => sum + (d.replies ?? 0), 0) / weekPerformance.length
    : 0;

  // Flat days: count consecutive days where results didn't improve
  let flatDays = 0;
  for (const day of weekPerformance) {
    if ((day.replies ?? 0) <= result7DayAvg) {
      flatDays++;
    } else {
      break;
    }
  }

  // Compute conversion rate from 7-day data
  const totalSent7Day = weekPerformance.reduce((sum, d) => sum + (d.outreachSent ?? 0), 0);
  const totalCustomers7Day = weekPerformance.reduce((sum, d) => sum + (d.customers ?? 0), 0);
  const conversionRate = totalSent7Day > 0 ? totalCustomers7Day / totalSent7Day : 0;

  actions.push({
    action: "computed_metrics",
    activity_today: activityToday,
    result_today: resultToday,
    activity_7day_avg: activity7DayAvg.toFixed(1),
    result_7day_avg: result7DayAvg.toFixed(1),
    flat_days: flatDays,
    conversion_rate: (conversionRate * 100).toFixed(2) + "%",
    active_experiments: activeExperiments.length,
  });

  // ── Enforcement: Course correction ────────────────────────
  const needsCourseCorrection = shouldTriggerCourseCorrection({
    activityToday,
    resultToday,
    activity7DayAvg,
    result7DayAvg,
    flatDays,
  });

  if (needsCourseCorrection) {
    await createAgentTaskFn({
      fromAgent: "ai-coo-lite",
      toAgent: "ai-sdr",
      taskType: "course_correction",
      priority: "high",
      payload: {
        reason: "Activity up but results flat for 3+ days",
        metrics: { activityToday, resultToday, activity7DayAvg: Math.round(activity7DayAvg), flatDays },
        suggestion: "Review email templates, check deliverability, verify contact quality",
      },
    });
    autonomousDecisions++;
    actions.push({ action: "course_correction", target: "ai-sdr", flat_days: flatDays });
  }

  // ── Enforcement: Force experiment ─────────────────────────
  const targetConversionRate = charter.primaryGoal.target > 0 ? 0.05 : 0;
  const needsExperiment = shouldForceExperiment({
    conversionRate,
    targetConversionRate,
    activeExperiments: activeExperiments.length,
    flatDays,
  });

  if (needsExperiment) {
    await createAgentTaskFn({
      fromAgent: "ai-coo-lite",
      toAgent: "growth-lead",
      taskType: "force_experiment",
      priority: "high",
      payload: {
        reason: "No active experiments and performance is flat",
        metrics: { conversionRate: (conversionRate * 100).toFixed(2), flatDays, activeExperiments: 0 },
        suggestion: "Test email subject lines or landing page variants for primary vertical",
      },
    });
    autonomousDecisions++;
    actions.push({ action: "force_experiment", target: "growth-lead", conversion_rate: conversionRate, flat_days: flatDays });
  }

  // ── Budget tracking ───────────────────────────────────────
  if (charter.budget) {
    const dailySpend = 0; // TODO: pull from ad platform spend when integrated
    const weeklySpend = 0;
    const dailyLimit = charter.budget.dailyLimit;
    const weeklyLimit = charter.budget.weeklyLimit;

    if (dailySpend > dailyLimit * 0.9) {
      await createAgentTaskFn({
        fromAgent: "ai-coo-lite",
        toAgent: "ceo",
        taskType: "budget_alert",
        priority: "urgent",
        payload: { reason: `Daily spend $${dailySpend} approaching limit $${dailyLimit}` },
      });
      escalations++;
      actions.push({ action: "budget_alert", daily_spend: dailySpend, limit: dailyLimit });
    }
  }

  // ── Agent health check ────────────────────────────────────
  const expectedAgents = ["revops", "ai-sdr", "content-director"];
  const reportingAgents = todayActivities.map((a) => a.agent);
  const missingAgents = expectedAgents.filter((a) => !reportingAgents.includes(a));

  if (missingAgents.length > 0) {
    actions.push({ action: "agent_health_warning", missing: missingAgents });
    // Escalate if critical agents are missing
    if (missingAgents.includes("ai-sdr")) {
      await createAgentTaskFn({
        fromAgent: "ai-coo-lite",
        toAgent: "ceo",
        taskType: "agent_down",
        priority: "urgent",
        payload: { reason: "AI SDR did not run today", missing_agents: missingAgents },
      });
      escalations++;
    }
  }

  await logActivity("ai-coo-lite", actions, {
    agents_reviewed: todayActivities.length,
    agents_missing: missingAgents.length,
    blockers_resolved: 0,
    escalations_made: escalations,
    autonomous_decisions: autonomousDecisions,
    conversion_rate: conversionRate,
    flat_days: flatDays,
  });

  return {
    agents_reviewed: todayActivities.length,
    active_experiments: activeExperiments.length,
    active_goals: directives.length,
    autonomous_decisions: autonomousDecisions,
    escalations,
    flat_days: flatDays,
    conversion_rate: conversionRate,
  };
}
