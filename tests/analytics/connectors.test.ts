import { describe, it, expect } from "vitest";
import {
	pullPostHogMetrics,
	pullGA4Metrics,
	pullAdMetrics,
} from "../../src/analytics/connectors.js";
import type { DateRange } from "../../src/core/types.js";

const dateRange: DateRange = {
	start: new Date("2026-03-01"),
	end: new Date("2026-03-15"),
};

describe("pullPostHogMetrics", () => {
	it("returns ok result with expected shape", async () => {
		const result = await pullPostHogMetrics("test-key", "https://app.posthog.com", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.totalEvents).toBeGreaterThan(0);
		expect(result.data.uniqueUsers).toBeGreaterThan(0);
		expect(Array.isArray(result.data.funnelSteps)).toBe(true);
		expect(result.data.funnelSteps.length).toBeGreaterThan(0);

		const step = result.data.funnelSteps[0];
		expect(step).toHaveProperty("step");
		expect(step).toHaveProperty("count");
		expect(step).toHaveProperty("conversionRate");
	});

	it("returns the correct metric types for PostHog", async () => {
		const result = await pullPostHogMetrics("test-key", "https://app.posthog.com", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(typeof result.data.totalEvents).toBe("number");
		expect(typeof result.data.uniqueUsers).toBe("number");
		for (const step of result.data.funnelSteps) {
			expect(typeof step.step).toBe("string");
			expect(typeof step.count).toBe("number");
			expect(typeof step.conversionRate).toBe("number");
		}
	});
});

describe("pullGA4Metrics", () => {
	it("returns ok result with expected shape", async () => {
		const result = await pullGA4Metrics("properties/12345", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.sessions).toBeGreaterThan(0);
		expect(result.data.pageviews).toBeGreaterThan(0);
		expect(typeof result.data.bounceRate).toBe("number");
		expect(typeof result.data.avgSessionDuration).toBe("number");
		expect(Array.isArray(result.data.topPages)).toBe(true);
		expect(Array.isArray(result.data.trafficSources)).toBe(true);
	});

	it("returns the correct metric types for GA4", async () => {
		const result = await pullGA4Metrics("properties/12345", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		for (const page of result.data.topPages) {
			expect(typeof page.path).toBe("string");
			expect(typeof page.views).toBe("number");
		}
		for (const src of result.data.trafficSources) {
			expect(typeof src.source).toBe("string");
			expect(typeof src.medium).toBe("string");
			expect(typeof src.sessions).toBe("number");
		}
	});
});

describe("pullAdMetrics", () => {
	it("returns ok result with expected shape for google_ads", async () => {
		const result = await pullAdMetrics("google_ads", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.impressions).toBeGreaterThan(0);
		expect(result.data.clicks).toBeGreaterThan(0);
		expect(typeof result.data.ctr).toBe("number");
		expect(typeof result.data.spend).toBe("number");
		expect(typeof result.data.conversions).toBe("number");
		expect(typeof result.data.cpa).toBe("number");
		expect(typeof result.data.roas).toBe("number");
	});

	it("returns ok result with expected shape for meta", async () => {
		const result = await pullAdMetrics("meta", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.impressions).toBeGreaterThan(0);
		expect(result.data.clicks).toBeGreaterThan(0);
	});

	it("returns ok result with expected shape for linkedin", async () => {
		const result = await pullAdMetrics("linkedin", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.data.impressions).toBeGreaterThan(0);
	});

	it("returns the correct metric types for ad platforms", async () => {
		const result = await pullAdMetrics("google_ads", dateRange);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(typeof result.data.impressions).toBe("number");
		expect(typeof result.data.clicks).toBe("number");
		expect(typeof result.data.ctr).toBe("number");
		expect(typeof result.data.spend).toBe("number");
		expect(typeof result.data.conversions).toBe("number");
		expect(typeof result.data.cpa).toBe("number");
		expect(typeof result.data.roas).toBe("number");
	});

	it("returns error for unsupported platform", async () => {
		const result = await pullAdMetrics("posthog", dateRange);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.error.code).toBe("UNSUPPORTED_AD_PLATFORM");
	});
});
