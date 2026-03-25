import { loadCharter, logActivity, readInbox } from "./helpers";
import { getDb } from "../../core/db";
import { experiments, verticalPerformanceDaily } from "../../core/db/schema";
import { eq, gte, desc } from "drizzle-orm";
import { createExperimentFn } from "../tools/experiments/create-experiment";
import { addExperimentVariantFn } from "../tools/experiments/add-experiment-variant";
import { startExperimentFn } from "../tools/experiments/start-experiment";
import { createAgentTaskFn } from "../tools/shared/create-agent-task";

export async function growthLeadDaily() {
  const charter = await loadCharter();
  if (!charter) throw new Error("No active system charter — run Phase 0 first");
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const inbox = await readInbox("growth-lead");
  const actions: unknown[] = [];
  let experimentsCreated = 0;

  actions.push({ action: "read_inbox", tasks_found: inbox.length });

  // Check for force_experiment tasks from COO
  const forceExperimentTasks = inbox.filter((t) => t.taskType === "force_experiment");

  for (const task of forceExperimentTasks) {
    const payload = JSON.parse(task.payload);

    // Determine what to test based on current performance data
    const recentPerf = await db
      .select()
      .from(verticalPerformanceDaily)
      .where(eq(verticalPerformanceDaily.vertical, charter.verticals.primary))
      .orderBy(desc(verticalPerformanceDaily.performanceDate))
      .limit(7);

    // Default: test email subject lines (highest leverage for cold outreach)
    const surface = "email_subject";
    const hypothesis = `Testing email subject line variants for ${charter.verticals.primary} — current reply rate is low, need to improve open rates first`;

    // Create the experiment
    const experimentId = await createExperimentFn({
      surface,
      hypothesis,
      ownerAgent: "growth-lead",
      primaryMetric: "reply_rate",
      minSendCount: charter.testing.minSendsOutbound,
      vertical: charter.verticals.primary,
    });

    // Request content variants from Content Director
    await createAgentTaskFn({
      fromAgent: "growth-lead",
      toAgent: "content-director",
      taskType: "generate_variant",
      priority: "high",
      payload: {
        experimentId,
        contentType: "cold_email",
        vertical: charter.verticals.primary,
        variants: 3,
        instruction: "Generate 3 distinct email subject line variants for A/B testing. Each should take a different angle: urgency, curiosity, direct value.",
      },
    });

    // Start the experiment (variants will be added when content-director fulfills the request)
    await startExperimentFn(experimentId);

    experimentsCreated++;
    actions.push({
      action: "created_experiment",
      experimentId,
      surface,
      hypothesis,
      triggered_by: task.fromAgent,
    });
  }

  // Check active experiments and evaluate if any are ready
  const runningExperiments = await db
    .select()
    .from(experiments)
    .where(eq(experiments.status, "running"));

  for (const exp of runningExperiments) {
    actions.push({
      action: "monitoring_experiment",
      experimentId: exp.id,
      surface: exp.surface,
      started: exp.startedAt,
    });
  }

  await logActivity("growth-lead", actions, {
    experiments_created: experimentsCreated,
    experiments_active: runningExperiments.length,
    tasks_processed: forceExperimentTasks.length,
  });

  return {
    experiments_created: experimentsCreated,
    experiments_active: runningExperiments.length,
  };
}
