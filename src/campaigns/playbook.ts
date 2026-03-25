import type { AwarenessStage, Channel } from "../core/types.js";

export interface CampaignPlay {
	id: string;
	name: string;
	channels: Channel[];
	stage: AwarenessStage;
	objective: string;
	description: string;
}

export const STAGE_PLAYBOOK: Record<AwarenessStage, CampaignPlay[]> = {
	identified: [
		{
			id: "tofu_search",
			name: "TOFU Search Ads",
			channels: ["google_ads"],
			stage: "identified",
			objective: "awareness",
			description:
				"Vertical-specific keyword search campaigns targeting active seekers",
		},
		{
			id: "tofu_social",
			name: "TOFU Social Awareness",
			channels: ["meta_ads", "linkedin_ads"],
			stage: "identified",
			objective: "awareness",
			description: "Cold audience awareness campaigns on social platforms",
		},
		{
			id: "cold_email",
			name: "Automated Cold Email",
			channels: ["email"],
			stage: "identified",
			objective: "engagement",
			description:
				"3-email cold outreach sequence triggered by signal detection",
		},
	],
	aware: [
		{
			id: "retargeting",
			name: "Retargeting Ads",
			channels: ["meta_ads", "google_ads"],
			stage: "aware",
			objective: "consideration",
			description: "Retarget site visitors and demo page viewers",
		},
		{
			id: "review_proof",
			name: "Review Social Proof",
			channels: ["meta_ads"],
			stage: "aware",
			objective: "trust",
			description: "Testimonial and review-based ad creative",
		},
		{
			id: "dynamic_landers",
			name: "Dynamic Landing Pages",
			channels: ["google_ads"],
			stage: "aware",
			objective: "conversion",
			description:
				"Vertical-specific landing pages with personalized copy",
		},
	],
	interested: [
		{
			id: "case_study",
			name: "Case Study Ads",
			channels: ["linkedin_ads", "meta_ads"],
			stage: "interested",
			objective: "conversion",
			description: "Vertical-specific case study promoted content",
		},
		{
			id: "demo_cta",
			name: "Demo CTA Campaigns",
			channels: ["google_ads", "meta_ads"],
			stage: "interested",
			objective: "conversion",
			description: "Direct demo call CTA campaigns",
		},
	],
	consider: [
		{
			id: "closing_offer",
			name: "Closing Offers",
			channels: ["email", "sms"],
			stage: "consider",
			objective: "conversion",
			description:
				"Free trial and limited-time offers for warm prospects",
		},
		{
			id: "sales_enablement",
			name: "Sales Enablement",
			channels: ["email"],
			stage: "consider",
			objective: "conversion",
			description:
				"ROI calculators, comparison sheets, and proposal materials",
		},
	],
	selecting: [
		{
			id: "final_nudge",
			name: "Final Nudge",
			channels: ["email", "sms"],
			stage: "selecting",
			objective: "conversion",
			description:
				"Last-touch conversion campaigns for decision-stage prospects",
		},
	],
};

export function getPlaysForStage(stage: AwarenessStage): CampaignPlay[] {
	return STAGE_PLAYBOOK[stage];
}

export function getPlaysForChannel(channel: Channel): CampaignPlay[] {
	return Object.values(STAGE_PLAYBOOK)
		.flat()
		.filter((play) => play.channels.includes(channel));
}
