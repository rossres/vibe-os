import type { Platform, DateRange } from "../core/types.js";
import { ok, err, type Result } from "../core/errors.js";

export interface MetricSnapshot {
	source: Platform;
	metricType: string;
	dimensions: Record<string, string>;
	values: Record<string, number>;
	periodStart: string;
	periodEnd: string;
}

export interface PostHogMetrics {
	totalEvents: number;
	uniqueUsers: number;
	funnelSteps: Array<{ step: string; count: number; conversionRate: number }>;
}

export interface GA4Metrics {
	sessions: number;
	pageviews: number;
	bounceRate: number;
	avgSessionDuration: number;
	topPages: Array<{ path: string; views: number }>;
	trafficSources: Array<{ source: string; medium: string; sessions: number }>;
}

export interface AdPlatformMetrics {
	impressions: number;
	clicks: number;
	ctr: number;
	spend: number;
	conversions: number;
	cpa: number;
	roas: number;
}

export async function pullPostHogMetrics(
	apiKey: string,
	host: string,
	dateRange: DateRange,
): Promise<Result<PostHogMetrics>> {
	try {
		// Placeholder: return mock data until live API keys are available
		const metrics: PostHogMetrics = {
			totalEvents: 12450,
			uniqueUsers: 3200,
			funnelSteps: [
				{ step: "page_view", count: 3200, conversionRate: 1.0 },
				{ step: "signup_started", count: 480, conversionRate: 0.15 },
				{ step: "signup_completed", count: 320, conversionRate: 0.1 },
				{ step: "demo_booked", count: 96, conversionRate: 0.03 },
			],
		};
		return ok(metrics);
	} catch (e) {
		return err({
			code: "POSTHOG_PULL_FAILED",
			message: e instanceof Error ? e.message : "PostHog pull failed",
			layer: "analytics",
			retryable: true,
		});
	}
}

export async function pullGA4Metrics(
	propertyId: string,
	dateRange: DateRange,
): Promise<Result<GA4Metrics>> {
	try {
		// Placeholder: return mock data until live API keys are available
		const metrics: GA4Metrics = {
			sessions: 8500,
			pageviews: 24000,
			bounceRate: 0.42,
			avgSessionDuration: 185,
			topPages: [
				{ path: "/", views: 8200 },
				{ path: "/pricing", views: 3100 },
				{ path: "/demo", views: 2400 },
				{ path: "/blog", views: 1800 },
				{ path: "/features", views: 1500 },
			],
			trafficSources: [
				{ source: "google", medium: "organic", sessions: 3400 },
				{ source: "google", medium: "cpc", sessions: 2100 },
				{ source: "facebook", medium: "paid", sessions: 1200 },
				{ source: "linkedin", medium: "paid", sessions: 800 },
				{ source: "direct", medium: "none", sessions: 1000 },
			],
		};
		return ok(metrics);
	} catch (e) {
		return err({
			code: "GA4_PULL_FAILED",
			message: e instanceof Error ? e.message : "GA4 pull failed",
			layer: "analytics",
			retryable: true,
		});
	}
}

export async function pullAdMetrics(
	platform: Platform,
	dateRange: DateRange,
): Promise<Result<AdPlatformMetrics>> {
	try {
		// Placeholder: return mock data per platform until live API keys are available
		const mockByPlatform: Record<string, AdPlatformMetrics> = {
			google_ads: {
				impressions: 45000,
				clicks: 2700,
				ctr: 0.06,
				spend: 5400,
				conversions: 135,
				cpa: 40,
				roas: 3.2,
			},
			meta: {
				impressions: 62000,
				clicks: 3100,
				ctr: 0.05,
				spend: 4200,
				conversions: 105,
				cpa: 40,
				roas: 2.8,
			},
			linkedin: {
				impressions: 18000,
				clicks: 720,
				ctr: 0.04,
				spend: 3600,
				conversions: 36,
				cpa: 100,
				roas: 1.5,
			},
		};

		const metrics = mockByPlatform[platform];
		if (!metrics) {
			return err({
				code: "UNSUPPORTED_AD_PLATFORM",
				message: `Ad metrics not supported for platform: ${platform}`,
				layer: "analytics",
				retryable: false,
			});
		}

		return ok(metrics);
	} catch (e) {
		return err({
			code: "AD_PULL_FAILED",
			message: e instanceof Error ? e.message : "Ad metrics pull failed",
			layer: "analytics",
			retryable: true,
		});
	}
}
