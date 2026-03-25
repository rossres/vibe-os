/**
 * Run the full Phase 1 daily loop manually.
 * Usage: npx tsx scripts/run-daily-loop.ts [workflow]
 *
 * Examples:
 *   npx tsx scripts/run-daily-loop.ts          # Run all workflows in order
 *   npx tsx scripts/run-daily-loop.ts content   # Run just content-daily
 *   npx tsx scripts/run-daily-loop.ts sdr       # Run just sdr-daily
 *   npx tsx scripts/run-daily-loop.ts revops    # Run just revops-daily
 *   npx tsx scripts/run-daily-loop.ts coo       # Run just coo-daily
 *   npx tsx scripts/run-daily-loop.ts growth    # Run just growth-lead-daily
 *   npx tsx scripts/run-daily-loop.ts experiments # Run just evaluate-experiments
 */
import "dotenv/config";
import { contentDaily } from "../src/mastra/workflows/content-daily";
import { sdrDaily } from "../src/mastra/workflows/sdr-daily";
import { revopsDaily } from "../src/mastra/workflows/revops-daily";
import { evaluateExperimentsDaily } from "../src/mastra/workflows/evaluate-experiments";
import { growthLeadDaily } from "../src/mastra/workflows/growth-lead-daily";
import { cooDaily } from "../src/mastra/workflows/coo-daily";

const workflows: Record<string, { name: string; fn: () => Promise<unknown> }> = {
  content: { name: "Content Director", fn: contentDaily },
  sdr: { name: "AI SDR", fn: sdrDaily },
  revops: { name: "RevOps", fn: revopsDaily },
  experiments: { name: "Experiment Evaluator", fn: evaluateExperimentsDaily },
  growth: { name: "Growth Lead", fn: growthLeadDaily },
  coo: { name: "AI COO", fn: cooDaily },
};

async function runWorkflow(key: string) {
  const wf = workflows[key];
  if (!wf) {
    console.error(`Unknown workflow: ${key}. Options: ${Object.keys(workflows).join(", ")}`);
    process.exit(1);
  }
  console.log(`\n[${wf.name}] Starting...`);
  const start = Date.now();
  try {
    const result = await wf.fn();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[${wf.name}] Complete (${elapsed}s)`);
    console.log(`[${wf.name}] Result:`, JSON.stringify(result, null, 2));
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`[${wf.name}] Failed (${elapsed}s):`, e);
  }
}

async function main() {
  const target = process.argv[2];

  if (target) {
    await runWorkflow(target);
  } else {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║   Phase 1 — Full Daily Loop             ║");
    console.log("╚══════════════════════════════════════════╝");

    const order = ["content", "sdr", "revops", "experiments", "growth", "coo"];
    for (const key of order) {
      await runWorkflow(key);
    }

    console.log("\n✓ Full daily loop complete.");
  }
}

main().catch((err) => {
  console.error("Daily loop failed:", err);
  process.exit(1);
});
