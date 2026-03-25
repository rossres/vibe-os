import { getDb } from "../core/db/index.js";
import { accounts, signals, content, campaigns, icpWeights, contentCalendar } from "../core/db/schema.js";
import { eq, desc, sql, gte, and } from "drizzle-orm";
import { STAGE_PLAYBOOK } from "../campaigns/playbook.js";

export interface DashboardData {
	rightNow: {
		activeCampaigns: Array<{ id: number; name: string; platform: string; status: string; vertical: string | null }>;
		pendingContent: Array<{ id: number; type: string; title: string | null; status: string; vertical: string | null }>;
		recentSignals: Array<{ id: number; signalType: string; source: string; strength: number; detectedAt: string; accountName: string | null }>;
	};
	doNext: Array<{ priority: number; action: string; reason: string; category: string }>;
	scoreboard: {
		accountsByTier: Array<{ tier: number | null; count: number }>;
		accountsByStage: Array<{ stage: string | null; count: number }>;
		contentThisWeek: number;
		topVertical: { vertical: string; count: number } | null;
		totalAccounts: number;
		totalSignals: number;
	};
}

export async function getDashboardData(): Promise<DashboardData> {
	const db = getDb();

	// === RIGHT NOW ===

	// Active campaigns
	const activeCampaigns = await db
		.select({
			id: campaigns.id,
			name: campaigns.name,
			platform: campaigns.platform,
			status: campaigns.status,
			vertical: campaigns.vertical,
		})
		.from(campaigns)
		.where(sql`${campaigns.status} != 'archived'`)
		.orderBy(desc(campaigns.createdAt))
		.limit(5);

	// Pending content (draft or review)
	const pendingContent = await db
		.select({
			id: content.id,
			type: content.type,
			title: content.title,
			status: content.status,
			vertical: content.vertical,
		})
		.from(content)
		.where(sql`${content.status} in ('draft', 'review')`)
		.orderBy(desc(content.createdAt))
		.limit(5);

	// Recent signals (last 7 days)
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
	const recentSignals = await db
		.select({
			id: signals.id,
			signalType: signals.signalType,
			source: signals.source,
			strength: signals.strength,
			detectedAt: signals.detectedAt,
			accountName: accounts.name,
		})
		.from(signals)
		.leftJoin(accounts, eq(signals.accountId, accounts.id))
		.where(gte(signals.detectedAt, sevenDaysAgo))
		.orderBy(desc(signals.detectedAt))
		.limit(10);

	// === SCOREBOARD ===

	const accountsByTier = await db
		.select({
			tier: accounts.tier,
			count: sql<number>`count(*)`,
		})
		.from(accounts)
		.groupBy(accounts.tier)
		.orderBy(accounts.tier);

	const accountsByStage = await db
		.select({
			stage: accounts.stage,
			count: sql<number>`count(*)`,
		})
		.from(accounts)
		.groupBy(accounts.stage);

	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
	const contentThisWeekResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(content)
		.where(gte(content.createdAt, weekAgo));
	const contentThisWeek = contentThisWeekResult[0]?.count ?? 0;

	const topVerticalResult = await db
		.select({
			vertical: accounts.vertical,
			count: sql<number>`count(*)`,
		})
		.from(accounts)
		.where(sql`${accounts.vertical} is not null`)
		.groupBy(accounts.vertical)
		.orderBy(desc(sql`count(*)`))
		.limit(1);

	const totalAccountsResult = await db.select({ count: sql<number>`count(*)` }).from(accounts);
	const totalSignalsResult = await db.select({ count: sql<number>`count(*)` }).from(signals);

	// === DO NEXT ===
	const doNext = await generateRecommendations(db);

	return {
		rightNow: {
			activeCampaigns,
			pendingContent,
			recentSignals,
		},
		doNext,
		scoreboard: {
			accountsByTier,
			accountsByStage,
			contentThisWeek,
			topVertical: topVerticalResult[0] ? { vertical: topVerticalResult[0].vertical!, count: topVerticalResult[0].count } : null,
			totalAccounts: totalAccountsResult[0]?.count ?? 0,
			totalSignals: totalSignalsResult[0]?.count ?? 0,
		},
	};
}

async function generateRecommendations(db: ReturnType<typeof getDb>): Promise<Array<{ priority: number; action: string; reason: string; category: string }>> {
	const recs: Array<{ priority: number; action: string; reason: string; category: string }> = [];
	let priority = 1;

	// Check for high-score accounts without campaigns
	const hotAccounts = await db
		.select({ count: sql<number>`count(*)` })
		.from(accounts)
		.where(and(gte(accounts.totalScore, 70), eq(accounts.stage, "identified")));

	if ((hotAccounts[0]?.count ?? 0) > 0) {
		recs.push({
			priority: priority++,
			action: `Reach out to ${hotAccounts[0].count} Tier 1 accounts still at "identified" stage`,
			reason: "High-scoring accounts haven't been contacted yet",
			category: "outreach",
		});
	}

	// Check for content gaps
	const pendingCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(content)
		.where(eq(content.status, "draft"));

	if ((pendingCount[0]?.count ?? 0) > 0) {
		recs.push({
			priority: priority++,
			action: `Review and approve ${pendingCount[0].count} draft content pieces`,
			reason: "Content is sitting in draft — approve to publish or send",
			category: "content",
		});
	}

	// Check for accounts needing enrichment
	const unenrichedAccounts = await db
		.select({ count: sql<number>`count(*)` })
		.from(accounts)
		.where(sql`${accounts.enrichedAt} is null`);

	if ((unenrichedAccounts[0]?.count ?? 0) > 0) {
		recs.push({
			priority: priority++,
			action: `Enrich ${unenrichedAccounts[0].count} accounts missing profile data`,
			reason: "Better profiles = better targeting and personalization",
			category: "enrichment",
		});
	}

	// Check if we have campaigns
	const campaignCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(campaigns);

	if ((campaignCount[0]?.count ?? 0) === 0) {
		recs.push({
			priority: priority++,
			action: "Create your first campaign — start with Google Search ads for your top vertical",
			reason: "No active campaigns yet. Search ads capture highest intent.",
			category: "campaigns",
		});
	}

	// If no data at all, suggest ingestion
	const totalAccounts = await db.select({ count: sql<number>`count(*)` }).from(accounts);
	if ((totalAccounts[0]?.count ?? 0) === 0) {
		recs.push({
			priority: 1,
			action: "Run signal scan to find prospects — or ingest source docs to load the knowledge base",
			reason: "The engine is empty. Feed it data and it starts working.",
			category: "setup",
		});
	}

	return recs.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
