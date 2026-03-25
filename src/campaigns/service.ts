import { eq, and, desc, like } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import {
	campaigns,
	adGroups,
	ads,
	keywords,
	campaignContent,
} from "../core/db/schema.js";
import type { AwarenessStage, Channel } from "../core/types.js";
import { ok, err, type Result } from "../core/errors.js";
import { getPlaysForStage, type CampaignPlay } from "./playbook.js";

export interface CampaignRecord {
	id: number;
	platform: string;
	externalId: string | null;
	name: string;
	objective: string | null;
	status: string;
	budget: number | null;
	budgetPeriod: string | null;
	vertical: string | null;
	stageTarget: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AdGroupRecord {
	id: number;
	campaignId: number;
	platform: string;
	externalId: string | null;
	name: string;
	targeting: string | null;
	status: string;
	createdAt: string;
}

export interface AdRecord {
	id: number;
	adGroupId: number;
	platform: string;
	externalId: string | null;
	contentId: number | null;
	status: string;
	metrics: string | null;
	createdAt: string;
}

export interface KeywordRecord {
	id: number;
	adGroupId: number;
	keyword: string;
	matchType: string;
	bid: number | null;
	status: string;
}

export interface FullCampaign extends CampaignRecord {
	adGroups: Array<
		AdGroupRecord & {
			ads: AdRecord[];
			keywords: KeywordRecord[];
		}
	>;
}

export interface CampaignServiceOptions {
	db?: Database;
}

export class CampaignService {
	private db: Database;

	constructor(options?: CampaignServiceOptions) {
		this.db = options?.db ?? getDb();
	}

	async create(config: {
		platform: Channel;
		name: string;
		objective?: string;
		budget?: number;
		budgetPeriod?: string;
		vertical?: string;
		stageTarget?: string;
	}): Promise<Result<CampaignRecord>> {
		try {
			const result = await this.db
				.insert(campaigns)
				.values({
					platform: config.platform,
					name: config.name,
					objective: config.objective ?? null,
					budget: config.budget ?? null,
					budgetPeriod: config.budgetPeriod ?? null,
					vertical: config.vertical ?? null,
					stageTarget: config.stageTarget ?? null,
				})
				.returning();

			return ok(result[0] as CampaignRecord);
		} catch (e) {
			return err({
				code: "CAMPAIGN_CREATE_FAILED",
				message: e instanceof Error ? e.message : "Failed to create campaign",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	async update(
		campaignId: number,
		changes: Partial<{ name: string; status: string; budget: number }>,
	): Promise<Result<CampaignRecord>> {
		try {
			const result = await this.db
				.update(campaigns)
				.set({
					...changes,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(campaigns.id, campaignId))
				.returning();

			if (result.length === 0) {
				return err({
					code: "CAMPAIGN_NOT_FOUND",
					message: `Campaign ${campaignId} not found`,
					layer: "campaigns",
					retryable: false,
				});
			}

			return ok(result[0] as CampaignRecord);
		} catch (e) {
			return err({
				code: "CAMPAIGN_UPDATE_FAILED",
				message: e instanceof Error ? e.message : "Failed to update campaign",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	async pause(campaignId: number): Promise<Result<CampaignRecord>> {
		return this.update(campaignId, { status: "paused" });
	}

	async resume(campaignId: number): Promise<Result<CampaignRecord>> {
		return this.update(campaignId, { status: "active" });
	}

	async addAdGroup(
		campaignId: number,
		config: { name: string; targeting?: string },
	): Promise<Result<AdGroupRecord>> {
		try {
			// Look up the campaign to get its platform
			const campaignRows = await this.db
				.select()
				.from(campaigns)
				.where(eq(campaigns.id, campaignId));

			if (campaignRows.length === 0) {
				return err({
					code: "CAMPAIGN_NOT_FOUND",
					message: `Campaign ${campaignId} not found`,
					layer: "campaigns",
					retryable: false,
				});
			}

			const result = await this.db
				.insert(adGroups)
				.values({
					campaignId,
					platform: campaignRows[0].platform,
					name: config.name,
					targeting: config.targeting ?? null,
				})
				.returning();

			return ok(result[0] as AdGroupRecord);
		} catch (e) {
			return err({
				code: "AD_GROUP_CREATE_FAILED",
				message: e instanceof Error ? e.message : "Failed to create ad group",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	async addAd(
		adGroupId: number,
		config: { platform: string; contentId?: number },
	): Promise<Result<AdRecord>> {
		try {
			const result = await this.db
				.insert(ads)
				.values({
					adGroupId,
					platform: config.platform,
					contentId: config.contentId ?? null,
				})
				.returning();

			return ok(result[0] as AdRecord);
		} catch (e) {
			return err({
				code: "AD_CREATE_FAILED",
				message: e instanceof Error ? e.message : "Failed to create ad",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	async addKeyword(
		adGroupId: number,
		config: { keyword: string; matchType: string; bid?: number },
	): Promise<Result<KeywordRecord>> {
		try {
			const result = await this.db
				.insert(keywords)
				.values({
					adGroupId,
					keyword: config.keyword,
					matchType: config.matchType,
					bid: config.bid ?? null,
				})
				.returning();

			return ok(result[0] as KeywordRecord);
		} catch (e) {
			return err({
				code: "KEYWORD_CREATE_FAILED",
				message: e instanceof Error ? e.message : "Failed to create keyword",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	async linkContent(
		campaignId: number,
		contentId: number,
	): Promise<Result<{ id: number; campaignId: number; contentId: number }>> {
		try {
			const result = await this.db
				.insert(campaignContent)
				.values({ campaignId, contentId })
				.returning();

			return ok(result[0]);
		} catch (e) {
			return err({
				code: "LINK_CONTENT_FAILED",
				message: e instanceof Error ? e.message : "Failed to link content",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	async getCampaign(campaignId: number): Promise<Result<FullCampaign>> {
		try {
			const campaignRows = await this.db
				.select()
				.from(campaigns)
				.where(eq(campaigns.id, campaignId));

			if (campaignRows.length === 0) {
				return err({
					code: "CAMPAIGN_NOT_FOUND",
					message: `Campaign ${campaignId} not found`,
					layer: "campaigns",
					retryable: false,
				});
			}

			const campaign = campaignRows[0] as CampaignRecord;

			const adGroupRows = await this.db
				.select()
				.from(adGroups)
				.where(eq(adGroups.campaignId, campaignId));

			const fullAdGroups = await Promise.all(
				adGroupRows.map(async (ag) => {
					const adRows = await this.db
						.select()
						.from(ads)
						.where(eq(ads.adGroupId, ag.id));

					const keywordRows = await this.db
						.select()
						.from(keywords)
						.where(eq(keywords.adGroupId, ag.id));

					return {
						...(ag as AdGroupRecord),
						ads: adRows as AdRecord[],
						keywords: keywordRows as KeywordRecord[],
					};
				}),
			);

			return ok({
				...campaign,
				adGroups: fullAdGroups,
			});
		} catch (e) {
			return err({
				code: "CAMPAIGN_GET_FAILED",
				message: e instanceof Error ? e.message : "Failed to get campaign",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	async listCampaigns(
		filters?: { platform?: string; status?: string; vertical?: string },
	): Promise<Result<CampaignRecord[]>> {
		try {
			const conditions = [];

			if (filters?.platform) {
				conditions.push(eq(campaigns.platform, filters.platform));
			}
			if (filters?.status) {
				conditions.push(eq(campaigns.status, filters.status));
			}
			if (filters?.vertical) {
				conditions.push(eq(campaigns.vertical, filters.vertical));
			}

			let query = this.db.select().from(campaigns);

			if (conditions.length > 0) {
				query = query.where(and(...conditions)) as typeof query;
			}

			const rows = await query.orderBy(desc(campaigns.createdAt));

			return ok(rows as CampaignRecord[]);
		} catch (e) {
			return err({
				code: "CAMPAIGN_LIST_FAILED",
				message: e instanceof Error ? e.message : "Failed to list campaigns",
				layer: "campaigns",
				retryable: false,
			});
		}
	}

	getRecommendedPlays(stage: AwarenessStage): CampaignPlay[] {
		return getPlaysForStage(stage);
	}
}
