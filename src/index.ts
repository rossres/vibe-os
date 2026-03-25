import "dotenv/config";
import { getDb } from "./core/index.js";
import { BrainService } from "./brain/index.js";
import { CopywriterService } from "./copywriter/index.js";
import { RadarService } from "./radar/index.js";
import { EnricherService } from "./enricher/index.js";
import { AnalyticsService } from "./analytics/index.js";
import { CampaignService } from "./campaigns/index.js";
import { PublisherService } from "./publisher/index.js";
import { CreativeService } from "./creative/index.js";
import { FeedbackLoopService } from "./loop/index.js";

export { getDb } from "./core/index.js";
export * from "./core/types.js";
export * from "./core/errors.js";
export { BrainService } from "./brain/index.js";
export { CopywriterService } from "./copywriter/index.js";
export { RadarService } from "./radar/index.js";
export { EnricherService } from "./enricher/index.js";
export { AnalyticsService } from "./analytics/index.js";
export { CampaignService } from "./campaigns/index.js";
export { getPlaysForStage, getPlaysForChannel, STAGE_PLAYBOOK } from "./campaigns/index.js";
export type { CampaignPlay } from "./campaigns/index.js";
export { PublisherService } from "./publisher/index.js";
export { CreativeService } from "./creative/index.js";
export { FeedbackLoopService } from "./loop/index.js";

export function createEngine(options?: { brandConfigPath?: string; model?: string }) {
	const db = getDb();
	const brain = new BrainService({
		brandConfigPath: options?.brandConfigPath ?? "./config/brand.yaml",
	});
	const copywriter = new CopywriterService({ brain, model: options?.model });
	const radar = new RadarService();
	const enricher = new EnricherService();
	const analytics = new AnalyticsService();
	const campaigns = new CampaignService();
	const publisher = new PublisherService();
	const creative = new CreativeService();
	const loop = new FeedbackLoopService();
	return { db, brain, copywriter, radar, enricher, analytics, campaigns, publisher, creative, loop };
}
