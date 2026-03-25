import { GoogleAdsApi, enums } from "google-ads-api";
import { getRefreshToken } from "./oauth.js";

export interface GoogleAdsConfig {
	customerId: string;
	managerId?: string;
	developerToken: string;
	clientId: string;
	clientSecret: string;
	refreshToken: string;
}

export interface CampaignInput {
	name: string;
	dailyBudgetMicros: number; // Budget in micros (e.g., 50_000_000 = $50)
	keywords: string[];
	adHeadlines: string[];
	adDescriptions: string[];
	finalUrl: string;
	vertical: string;
}

export interface CampaignResult {
	campaignId: string;
	adGroupId: string;
	budgetId: string;
	keywordsAdded: number;
}

export class GoogleAdsService {
	private client: GoogleAdsApi | null = null;
	private customerId: string;
	private managerId: string;

	constructor() {
		this.customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID ?? "").replace(/-/g, "");
		this.managerId = (process.env.GOOGLE_ADS_MANAGER_ID ?? "").replace(/-/g, "");
	}

	get isConfigured(): boolean {
		return (
			this.customerId.length > 0 &&
			(process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "").length > 0 &&
			(process.env.GOOGLE_CLIENT_ID ?? "").length > 0
		);
	}

	private async getClient(): Promise<GoogleAdsApi> {
		if (this.client) return this.client;

		const refreshToken = await getRefreshToken();
		if (!refreshToken) {
			throw new Error("No Google Ads refresh token. Visit /oauth/google-ads to authorize.");
		}

		this.client = new GoogleAdsApi({
			client_id: process.env.GOOGLE_CLIENT_ID!,
			client_secret: process.env.GOOGLE_CLIENT_SECRET!,
			developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
		});

		return this.client;
	}

	private async getCustomer() {
		const client = await this.getClient();
		const refreshToken = await getRefreshToken();
		return client.Customer({
			customer_id: this.customerId,
			login_customer_id: this.managerId || this.customerId,
			refresh_token: refreshToken!,
		});
	}

	/**
	 * Create a search campaign with keywords and responsive search ads.
	 */
	async createSearchCampaign(input: CampaignInput): Promise<CampaignResult> {
		const customer = await this.getCustomer();

		// 1. Create campaign budget
		const budgetResult = await customer.campaignBudgets.create([
			{
				name: `${input.name} Budget`,
				amount_micros: input.dailyBudgetMicros,
				delivery_method: enums.BudgetDeliveryMethod.STANDARD,
			},
		]);
		const budgetResourceName = budgetResult.results[0].resource_name!;

		// 2. Create campaign
		const campaignResult = await customer.campaigns.create([
			{
				name: input.name,
				advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
				status: enums.CampaignStatus.PAUSED, // Start paused for review
				campaign_budget: budgetResourceName,
				manual_cpc: {}, // Manual CPC bidding
				network_settings: {
					target_google_search: true,
					target_search_network: false,
					target_content_network: false,
				},
			},
		]);
		const campaignResourceName = campaignResult.results[0].resource_name!;
		const campaignId = campaignResourceName.split("/").pop()!;

		// 3. Create ad group
		const adGroupResult = await customer.adGroups.create([
			{
				name: `${input.name} - ${input.vertical}`,
				campaign: campaignResourceName,
				status: enums.AdGroupStatus.ENABLED,
				type: enums.AdGroupType.SEARCH_STANDARD,
				cpc_bid_micros: 2_000_000, // $2 default CPC bid
			},
		]);
		const adGroupResourceName = adGroupResult.results[0].resource_name!;
		const adGroupId = adGroupResourceName.split("/").pop()!;

		// 4. Add keywords
		const keywordOps = input.keywords.map((keyword) => ({
			ad_group: adGroupResourceName,
			keyword: { text: keyword, match_type: enums.KeywordMatchType.PHRASE },
			status: enums.AdGroupCriterionStatus.ENABLED,
		}));
		await customer.adGroupCriteria.create(keywordOps);

		// 5. Create responsive search ad
		const headlines = input.adHeadlines.slice(0, 15).map((text) => ({
			text: text.slice(0, 30), // Max 30 chars per headline
		}));
		const descriptions = input.adDescriptions.slice(0, 4).map((text) => ({
			text: text.slice(0, 90), // Max 90 chars per description
		}));

		await customer.adGroupAds.create([
			{
				ad_group: adGroupResourceName,
				ad: {
					responsive_search_ad: {
						headlines,
						descriptions,
					},
					final_urls: [input.finalUrl],
				},
				status: enums.AdGroupAdStatus.ENABLED,
			},
		]);

		return {
			campaignId,
			adGroupId,
			budgetId: budgetResourceName.split("/").pop()!,
			keywordsAdded: input.keywords.length,
		};
	}

	/**
	 * Get campaign performance metrics.
	 */
	async getCampaignPerformance(campaignId?: string) {
		const customer = await this.getCustomer();

		let query = `
			SELECT
				campaign.id,
				campaign.name,
				campaign.status,
				metrics.impressions,
				metrics.clicks,
				metrics.cost_micros,
				metrics.conversions,
				metrics.average_cpc
			FROM campaign
			WHERE segments.date DURING LAST_7_DAYS
		`;

		if (campaignId) {
			query += ` AND campaign.id = ${campaignId}`;
		}

		const results = await customer.query(query);
		return results.map((row: any) => ({
			id: row.campaign?.id,
			name: row.campaign?.name,
			status: row.campaign?.status,
			impressions: Number(row.metrics?.impressions ?? 0),
			clicks: Number(row.metrics?.clicks ?? 0),
			costMicros: Number(row.metrics?.cost_micros ?? 0),
			cost: Number(row.metrics?.cost_micros ?? 0) / 1_000_000,
			conversions: Number(row.metrics?.conversions ?? 0),
			avgCpc: Number(row.metrics?.average_cpc ?? 0) / 1_000_000,
		}));
	}

	/**
	 * Pause or enable a campaign.
	 */
	async setCampaignStatus(campaignId: string, enabled: boolean) {
		const customer = await this.getCustomer();
		await customer.campaigns.update([
			{
				resource_name: `customers/${this.customerId}/campaigns/${campaignId}`,
				status: enabled ? enums.CampaignStatus.ENABLED : enums.CampaignStatus.PAUSED,
			},
		]);
	}
}
