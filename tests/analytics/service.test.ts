import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { getDb } from "../../src/core/db/index.js";
import { analyticsSnapshots } from "../../src/core/db/schema.js";
import { AnalyticsService } from "../../src/analytics/service.js";
import type { MetricSnapshot } from "../../src/analytics/connectors.js";
import type { DateRange } from "../../src/core/types.js";

const TEST_PERIOD_START = "2026-03-01T00:00:00.000Z";
const TEST_PERIOD_END = "2026-03-15T00:00:00.000Z";

const dateRange: DateRange = {
	start: new Date(TEST_PERIOD_START),
	end: new Date(TEST_PERIOD_END),
};

describe("AnalyticsService", () => {
	const db = getDb();
	let service: AnalyticsService;

	beforeEach(async () => {
		service = new AnalyticsService({ db });
	});

	afterEach(async () => {
		// Clean up test snapshots by period range
		await db
			.delete(analyticsSnapshots)
			.where(
				and(
					eq(analyticsSnapshots.periodStart, TEST_PERIOD_START),
					eq(analyticsSnapshots.periodEnd, TEST_PERIOD_END),
				),
			);
	});

	it("saveSnapshot stores to DB", async () => {
		const snapshot: MetricSnapshot = {
			source: "posthog",
			metricType: "funnel",
			dimensions: { vertical: "nail-beauty" },
			values: { totalEvents: 500, uniqueUsers: 120 },
			periodStart: TEST_PERIOD_START,
			periodEnd: TEST_PERIOD_END,
		};

		await service.saveSnapshot(snapshot);

		const rows = await db
			.select()
			.from(analyticsSnapshots)
			.where(
				and(
					eq(analyticsSnapshots.source, "posthog"),
					eq(analyticsSnapshots.periodStart, TEST_PERIOD_START),
					eq(analyticsSnapshots.periodEnd, TEST_PERIOD_END),
				),
			);

		expect(rows.length).toBeGreaterThanOrEqual(1);
		const stored = rows[0];
		expect(stored.source).toBe("posthog");
		expect(stored.metricType).toBe("funnel");
		expect(JSON.parse(stored.values)).toEqual({ totalEvents: 500, uniqueUsers: 120 });
		expect(JSON.parse(stored.dimensions!)).toEqual({ vertical: "nail-beauty" });
	});

	it("pull returns a report with sources pulled", async () => {
		const result = await service.pull(["posthog", "ga4", "google_ads"], dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.sourcesPulled).toContain("posthog");
		expect(result.data.sourcesPulled).toContain("ga4");
		expect(result.data.sourcesPulled).toContain("google_ads");
		expect(result.data.snapshotsSaved).toBeGreaterThan(0);
		expect(result.data.errors).toHaveLength(0);
	});

	it("getFunnelMetrics returns funnel stages", async () => {
		// First, pull PostHog data to populate snapshots
		await service.pull(["posthog"], dateRange);

		const result = await service.getFunnelMetrics(dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.stages.length).toBeGreaterThan(0);
		for (const stage of result.data.stages) {
			expect(typeof stage.name).toBe("string");
			expect(typeof stage.count).toBe("number");
			expect(typeof stage.conversionRate).toBe("number");
		}
		expect(typeof result.data.overallConversion).toBe("number");
		expect(result.data.overallConversion).toBeGreaterThan(0);
		expect(result.data.overallConversion).toBeLessThanOrEqual(1);
	});

	it("getChannelPerformance returns channel data", async () => {
		// Pull ad platform data first
		await service.pull(["google_ads", "meta", "linkedin"], dateRange);

		const result = await service.getChannelPerformance(dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.length).toBeGreaterThan(0);

		for (const ch of result.data) {
			expect(typeof ch.channel).toBe("string");
			expect(typeof ch.impressions).toBe("number");
			expect(typeof ch.clicks).toBe("number");
			expect(typeof ch.conversions).toBe("number");
			expect(typeof ch.spend).toBe("number");
			expect(typeof ch.cpa).toBe("number");
			expect(typeof ch.roas).toBe("number");
		}

		const channels = result.data.map((c) => c.channel);
		expect(channels).toContain("google_ads");
		expect(channels).toContain("meta");
		expect(channels).toContain("linkedin");
	});

	it("generateReport returns structured report", async () => {
		// Pull all data to populate snapshots
		await service.pull(["posthog", "ga4", "google_ads"], dateRange);

		const result = await service.generateReport("weekly", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.type).toBe("weekly");
		expect(result.data.dateRange).toEqual(dateRange);
		expect(typeof result.data.generatedAt).toBe("string");
		expect(Array.isArray(result.data.sections)).toBe(true);
		expect(result.data.sections.length).toBeGreaterThan(0);

		const sectionTitles = result.data.sections.map((s) => s.title);
		expect(sectionTitles).toContain("Funnel Performance");
		expect(sectionTitles).toContain("Channel Performance");
		expect(sectionTitles).toContain("Traffic Overview");
	});
});
