import { describe, it, expect, afterEach } from "vitest";
import { eq, like } from "drizzle-orm";
import { getDb } from "../../src/core/db/index.js";
import {
	campaigns,
	adGroups,
	ads,
	keywords,
	campaignContent,
	content,
} from "../../src/core/db/schema.js";
import { CampaignService } from "../../src/campaigns/service.js";

describe("CampaignService", () => {
	const db = getDb();
	const service = new CampaignService({ db });

	afterEach(async () => {
		// Find all test campaigns
		const testCampaigns = await db
			.select()
			.from(campaigns)
			.where(like(campaigns.name, "__test_%"));

		for (const c of testCampaigns) {
			// Find ad groups for this campaign
			const groups = await db
				.select()
				.from(adGroups)
				.where(eq(adGroups.campaignId, c.id));

			// Delete child records of each ad group
			for (const ag of groups) {
				await db.delete(keywords).where(eq(keywords.adGroupId, ag.id));
				await db.delete(ads).where(eq(ads.adGroupId, ag.id));
			}

			// Delete ad groups
			await db.delete(adGroups).where(eq(adGroups.campaignId, c.id));

			// Delete campaign-content links
			await db
				.delete(campaignContent)
				.where(eq(campaignContent.campaignId, c.id));

			// Delete the campaign itself
			await db.delete(campaigns).where(eq(campaigns.id, c.id));
		}

		// Clean up test content rows (after campaign_content links are gone)
		await db.delete(content).where(like(content.title, "__test_%"));
	});

	it("create inserts a campaign and returns it with ID", async () => {
		const result = await service.create({
			platform: "google_ads",
			name: "__test_create_campaign",
			objective: "awareness",
			budget: 500,
			budgetPeriod: "daily",
			vertical: "nail-beauty",
			stageTarget: "identified",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.id).toBeGreaterThan(0);
		expect(result.data.platform).toBe("google_ads");
		expect(result.data.name).toBe("__test_create_campaign");
		expect(result.data.objective).toBe("awareness");
		expect(result.data.budget).toBe(500);
		expect(result.data.status).toBe("draft");
	});

	it("update changes campaign fields", async () => {
		const created = await service.create({
			platform: "meta_ads",
			name: "__test_update_campaign",
		});
		if (!created.ok) throw new Error("Setup failed");

		const result = await service.update(created.data.id, {
			name: "__test_update_campaign_renamed",
			budget: 1000,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.name).toBe("__test_update_campaign_renamed");
		expect(result.data.budget).toBe(1000);
	});

	it("pause sets status to paused", async () => {
		const created = await service.create({
			platform: "google_ads",
			name: "__test_pause_campaign",
		});
		if (!created.ok) throw new Error("Setup failed");

		// First activate it
		await service.resume(created.data.id);

		const result = await service.pause(created.data.id);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.status).toBe("paused");
	});

	it("resume sets status to active", async () => {
		const created = await service.create({
			platform: "google_ads",
			name: "__test_resume_campaign",
		});
		if (!created.ok) throw new Error("Setup failed");

		const result = await service.resume(created.data.id);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.status).toBe("active");
	});

	it("addAdGroup creates ad group linked to campaign", async () => {
		const created = await service.create({
			platform: "google_ads",
			name: "__test_adgroup_campaign",
		});
		if (!created.ok) throw new Error("Setup failed");

		const result = await service.addAdGroup(created.data.id, {
			name: "__test_ad_group_1",
			targeting: "nail salons near me",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.id).toBeGreaterThan(0);
		expect(result.data.campaignId).toBe(created.data.id);
		expect(result.data.name).toBe("__test_ad_group_1");
		expect(result.data.platform).toBe("google_ads");
		expect(result.data.targeting).toBe("nail salons near me");
	});

	it("addKeyword creates keyword linked to ad group", async () => {
		const created = await service.create({
			platform: "google_ads",
			name: "__test_keyword_campaign",
		});
		if (!created.ok) throw new Error("Setup failed");

		const ag = await service.addAdGroup(created.data.id, {
			name: "__test_keyword_ag",
		});
		if (!ag.ok) throw new Error("Setup failed");

		const result = await service.addKeyword(ag.data.id, {
			keyword: "__test_nail salon software",
			matchType: "phrase",
			bid: 2.5,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.id).toBeGreaterThan(0);
		expect(result.data.adGroupId).toBe(ag.data.id);
		expect(result.data.keyword).toBe("__test_nail salon software");
		expect(result.data.matchType).toBe("phrase");
		expect(result.data.bid).toBe(2.5);
	});

	it("listCampaigns with platform filter", async () => {
		await service.create({
			platform: "google_ads",
			name: "__test_list_google",
		});
		await service.create({
			platform: "meta_ads",
			name: "__test_list_meta",
		});

		const result = await service.listCampaigns({ platform: "google_ads" });

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const testOnes = result.data.filter((c) =>
			c.name.startsWith("__test_list_"),
		);
		expect(testOnes.length).toBeGreaterThanOrEqual(1);
		for (const c of testOnes) {
			expect(c.platform).toBe("google_ads");
		}
	});

	it("getCampaign returns full campaign hierarchy", async () => {
		const created = await service.create({
			platform: "google_ads",
			name: "__test_hierarchy_campaign",
		});
		if (!created.ok) throw new Error("Setup failed");

		const ag = await service.addAdGroup(created.data.id, {
			name: "__test_hierarchy_ag",
		});
		if (!ag.ok) throw new Error("Setup failed");

		await service.addAd(ag.data.id, { platform: "google_ads" });
		await service.addKeyword(ag.data.id, {
			keyword: "__test_nail salon",
			matchType: "broad",
		});

		const result = await service.getCampaign(created.data.id);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.id).toBe(created.data.id);
		expect(result.data.name).toBe("__test_hierarchy_campaign");
		expect(result.data.adGroups.length).toBe(1);
		expect(result.data.adGroups[0].ads.length).toBe(1);
		expect(result.data.adGroups[0].keywords.length).toBe(1);
	});

	it("linkContent creates campaign-content association", async () => {
		const created = await service.create({
			platform: "google_ads",
			name: "__test_link_campaign",
		});
		if (!created.ok) throw new Error("Setup failed");

		// Create a content row to link to
		const contentRows = await db
			.insert(content)
			.values({
				type: "ad_copy",
				body: "Test ad copy body",
				title: "__test_link_content",
			})
			.returning();

		const contentId = contentRows[0].id;

		const result = await service.linkContent(created.data.id, contentId);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.campaignId).toBe(created.data.id);
		expect(result.data.contentId).toBe(contentId);
	});
});
