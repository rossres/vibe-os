import { loadCharter, logActivity } from "./helpers";
import { getDb } from "../../core/db";
import { experiments } from "../../core/db/schema";
import { eq } from "drizzle-orm";
import { evaluateExperimentFn } from "../tools/experiments/evaluate-experiment";
import { createAgentTaskFn } from "../tools/shared/create-agent-task";

export async function evaluateExperimentsDaily() {
  const charter = await loadCharter();
  if (!charter) throw new Error("No active system charter — run Phase 0 first");
  const db = getDb();
  const actions: unknown[] = [];
  const running = await db.select().from(experiments).where(eq(experiments.status, "running"));
  actions.push({ action: "load_running_experiments", count: running.length });

  for (const exp of running) {
    const decision = await evaluateExperimentFn(exp.id);
    actions.push({ action: "evaluate", experiment: exp.id, decision: decision.decision });
    if (decision.decision === "winner_found") {
      await db.update(experiments).set({ status: "won", winnerVariantId: decision.winnerVariantId, endedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(experiments.id, exp.id));
      await createAgentTaskFn({ fromAgent: "evaluate-experiments", toAgent: "growth-lead", taskType: "experiment_result", payload: { experimentId: exp.id, decision: decision.decision, winner: decision.winnerVariantId } });
      await createAgentTaskFn({ fromAgent: "evaluate-experiments", toAgent: "ai-coo-lite", taskType: "experiment_result", payload: { experimentId: exp.id, decision: decision.decision, winner: decision.winnerVariantId } });
    }
  }

  await logActivity("evaluate-experiments", actions, { experiments_evaluated: running.length });
  return { experiments_evaluated: running.length };
}
