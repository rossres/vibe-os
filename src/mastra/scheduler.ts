import cron from "node-cron";
import { contentDaily } from "./workflows/content-daily";
import { cooDaily } from "./workflows/coo-daily";
import { evaluateExperimentsDaily } from "./workflows/evaluate-experiments";
import { growthLeadDaily } from "./workflows/growth-lead-daily";
import { revopsDaily } from "./workflows/revops-daily";
import { sdrDaily } from "./workflows/sdr-daily";

export function startScheduler() {
	console.log("[Scheduler] Starting Phase 1 agent schedules...");

	// Content first — templates must exist before SDR can send
	cron.schedule("0 7 * * *", async () => {
		console.log("[Scheduler] Running content-daily...");
		try {
			await contentDaily();
			console.log("[Scheduler] content-daily complete");
		} catch (e) {
			console.error("[Scheduler] content-daily failed:", e);
		}
	});

	// SDR after content — discover, enrich, send outreach
	cron.schedule("0 8 * * *", async () => {
		console.log("[Scheduler] Running sdr-daily...");
		try {
			await sdrDaily();
			console.log("[Scheduler] sdr-daily complete");
		} catch (e) {
			console.error("[Scheduler] sdr-daily failed:", e);
		}
	});

	// RevOps after SDR — snapshot today's metrics
	cron.schedule("0 12 * * *", async () => {
		console.log("[Scheduler] Running revops-daily...");
		try {
			await revopsDaily();
			console.log("[Scheduler] revops-daily complete");
		} catch (e) {
			console.error("[Scheduler] revops-daily failed:", e);
		}
	});

	// Evaluate experiments mid-afternoon
	cron.schedule("0 15 * * *", async () => {
		console.log("[Scheduler] Running evaluate-experiments...");
		try {
			await evaluateExperimentsDaily();
			console.log("[Scheduler] evaluate-experiments complete");
		} catch (e) {
			console.error("[Scheduler] evaluate-experiments failed:", e);
		}
	});

	// Growth Lead after experiment evaluation
	cron.schedule("0 16 * * *", async () => {
		console.log("[Scheduler] Running growth-lead-daily...");
		try {
			await growthLeadDaily();
			console.log("[Scheduler] growth-lead-daily complete");
		} catch (e) {
			console.error("[Scheduler] growth-lead-daily failed:", e);
		}
	});

	// COO last — enforces based on all data from the day
	cron.schedule("0 17 * * *", async () => {
		console.log("[Scheduler] Running coo-daily...");
		try {
			await cooDaily();
			console.log("[Scheduler] coo-daily complete");
		} catch (e) {
			console.error("[Scheduler] coo-daily failed:", e);
		}
	});

	console.log("[Scheduler] All schedules registered:");
	console.log("  07:00 - Content Director (generate templates)");
	console.log("  08:00 - AI SDR (discover + enrich + send)");
	console.log("  12:00 - RevOps (snapshot metrics)");
	console.log("  15:00 - Experiment Evaluator (analyze tests)");
	console.log("  16:00 - Growth Lead (create/monitor experiments)");
	console.log("  17:00 - AI COO (enforce + escalate)");
}
