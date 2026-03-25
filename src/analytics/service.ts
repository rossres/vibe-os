import { eq, and, gte, lte } from "drizzle-orm";
import { getDb, type Database } from "../core/db/index.js";
import { analyticsSnapshots } from "../core/db/schema.js";
import type { Platform, DateRange } from "../core/types.js";
import { ok, err, type Result } from "../core/errors.js";
import type { PlatformConfig } from "../core/config.js";
import {
	pullPostHogMetrics,
	pullGA4Metrics,
	pullAdMetrics,
	type MetricSnapshot,
} from "./connectors.js";

export interface AnalyticsServiceOptions {
	platformConfig?: PlatformConfig;
	db?: Database;
}

export interface PullReport {
	sourcesPulled: string[];
	snapshotsSaved: number;
	errors: string[];
}

export interface FunnelMetrics {
	stages: Array<{ name: string; count: number; conversionRate: number }>;
	overallConversion: number;
}

export interface ChannelPerformance {
	channel: string;
	impressions: number;
	clicks: number;
	conversions: number;
	spend: number;
	cpa: number;
	roas: number;
}

export interface Report {
	type: string;
	dateRange: DateRange;
	generatedAt: string;
	sections: Array<{ title: string; data: Record<string, unknown> }>;
}

const AD_PLATFORMS: Platform[] = ["google_ads", "meta", "linkedin"];

export class AnalyticsService {
	private db: Database;
	private platformConfig?: PlatformConfig;

	constructor(options?: AnalyticsServiceOptions) {
		this.db = options?.db ?? getDb();
		this.platformConfig = options?.platformConfig;
	}

	async pull(
		sources?: Platform[],
		dateRange?: DateRange,
	): Promise<Result<PullReport>> {
		const range = dateRange ?? defaultDateRange();
		const platformList = sources ?? ["posthog", "ga4", ...AD_PLATFORMS];

		const report: PullReport = {
			sourcesPulled: [],
			snapshotsSaved: 0,
			errors: [],
		};

		for (const platform of platformList) {
			try {
				if (platform === "posthog") {
					const apiKey = this.platformConfig?.posthog?.api_key ?? "placeholder";
					const host = this.platformConfig?.posthog?.host ?? "https://app.posthog.com";
					const result = await pullPostHogMetrics(apiKey, host, range);
					if (result.ok) {
						const snapshot: MetricSnapshot = {
							source: "posthog",
							metricType: "funnel",
							dimensions: {},
							values: {
								totalEvents: result.data.totalEvents,
								uniqueUsers: result.data.uniqueUsers,
							},
							periodStart: range.start.toISOString(),
							periodEnd: range.end.toISOString(),
						};
						await this.saveSnapshot(snapshot);
						// Save funnel steps as a separate snapshot
						const funnelSnapshot: MetricSnapshot = {
							source: "posthog",
							metricType: "funnel_steps",
							dimensions: {},
							values: Object.fromEntries(
								result.data.funnelSteps.map((s) => [s.step, s.count]),
							),
							periodStart: range.start.toISOString(),
							periodEnd: range.end.toISOString(),
						};
						await this.saveSnapshot(funnelSnapshot);
						report.snapshotsSaved += 2;
						report.sourcesPulled.push("posthog");
					} else {
						report.errors.push(result.error.message);
					}
				} else if (platform === "ga4") {
					const propertyId =
						this.platformConfig?.ga4?.property_id ?? "placeholder";
					const result = await pullGA4Metrics(propertyId, range);
					if (result.ok) {
						const snapshot: MetricSnapshot = {
							source: "ga4",
							metricType: "traffic",
							dimensions: {},
							values: {
								sessions: result.data.sessions,
								pageviews: result.data.pageviews,
								bounceRate: result.data.bounceRate,
								avgSessionDuration: result.data.avgSessionDuration,
							},
							periodStart: range.start.toISOString(),
							periodEnd: range.end.toISOString(),
						};
						await this.saveSnapshot(snapshot);
						report.snapshotsSaved += 1;
						report.sourcesPulled.push("ga4");
					} else {
						report.errors.push(result.error.message);
					}
				} else if (AD_PLATFORMS.includes(platform)) {
					const result = await pullAdMetrics(platform, range);
					if (result.ok) {
						const snapshot: MetricSnapshot = {
							source: platform,
							metricType: "ad_performance",
							dimensions: { channel: platform },
							values: {
								impressions: result.data.impressions,
								clicks: result.data.clicks,
								ctr: result.data.ctr,
								spend: result.data.spend,
								conversions: result.data.conversions,
								cpa: result.data.cpa,
								roas: result.data.roas,
							},
							periodStart: range.start.toISOString(),
							periodEnd: range.end.toISOString(),
						};
						await this.saveSnapshot(snapshot);
						report.snapshotsSaved += 1;
						report.sourcesPulled.push(platform);
					} else {
						report.errors.push(result.error.message);
					}
				}
			} catch (e) {
				report.errors.push(
					`${platform}: ${e instanceof Error ? e.message : "unknown error"}`,
				);
			}
		}

		return ok(report);
	}

	async saveSnapshot(snapshot: MetricSnapshot): Promise<void> {
		await this.db.insert(analyticsSnapshots).values({
			source: snapshot.source,
			metricType: snapshot.metricType,
			dimensions: JSON.stringify(snapshot.dimensions),
			values: JSON.stringify(snapshot.values),
			periodStart: snapshot.periodStart,
			periodEnd: snapshot.periodEnd,
		});
	}

	async getFunnelMetrics(dateRange: DateRange): Promise<Result<FunnelMetrics>> {
		try {
			const rows = await this.db
				.select()
				.from(analyticsSnapshots)
				.where(
					and(
						eq(analyticsSnapshots.source, "posthog"),
						eq(analyticsSnapshots.metricType, "funnel_steps"),
						gte(analyticsSnapshots.periodStart, dateRange.start.toISOString()),
						lte(analyticsSnapshots.periodEnd, dateRange.end.toISOString()),
					),
				);

			if (rows.length === 0) {
				return ok({
					stages: [],
					overallConversion: 0,
				});
			}

			// Use the latest funnel snapshot
			const latest = rows[rows.length - 1];
			const values: Record<string, number> = JSON.parse(latest.values);
			const entries = Object.entries(values);

			const firstCount = entries.length > 0 ? entries[0][1] : 0;
			const stages = entries.map(([name, count]) => ({
				name,
				count,
				conversionRate: firstCount > 0 ? count / firstCount : 0,
			}));

			const lastCount = entries.length > 0 ? entries[entries.length - 1][1] : 0;
			const overallConversion = firstCount > 0 ? lastCount / firstCount : 0;

			return ok({ stages, overallConversion });
		} catch (e) {
			return err({
				code: "FUNNEL_QUERY_FAILED",
				message: e instanceof Error ? e.message : "Funnel query failed",
				layer: "analytics",
				retryable: false,
			});
		}
	}

	async getChannelPerformance(
		dateRange: DateRange,
	): Promise<Result<ChannelPerformance[]>> {
		try {
			const rows = await this.db
				.select()
				.from(analyticsSnapshots)
				.where(
					and(
						eq(analyticsSnapshots.metricType, "ad_performance"),
						gte(analyticsSnapshots.periodStart, dateRange.start.toISOString()),
						lte(analyticsSnapshots.periodEnd, dateRange.end.toISOString()),
					),
				);

			const channelMap = new Map<string, ChannelPerformance>();

			for (const row of rows) {
				const values: Record<string, number> = JSON.parse(row.values);
				const dims: Record<string, string> = row.dimensions
					? JSON.parse(row.dimensions)
					: {};
				const channel = dims.channel ?? row.source;

				const existing = channelMap.get(channel);
				if (existing) {
					existing.impressions += values.impressions ?? 0;
					existing.clicks += values.clicks ?? 0;
					existing.conversions += values.conversions ?? 0;
					existing.spend += values.spend ?? 0;
					existing.cpa =
						existing.conversions > 0
							? existing.spend / existing.conversions
							: 0;
					existing.roas =
						existing.spend > 0
							? (existing.conversions * existing.cpa) / existing.spend
							: 0;
				} else {
					channelMap.set(channel, {
						channel,
						impressions: values.impressions ?? 0,
						clicks: values.clicks ?? 0,
						conversions: values.conversions ?? 0,
						spend: values.spend ?? 0,
						cpa: values.cpa ?? 0,
						roas: values.roas ?? 0,
					});
				}
			}

			return ok(Array.from(channelMap.values()));
		} catch (e) {
			return err({
				code: "CHANNEL_QUERY_FAILED",
				message: e instanceof Error ? e.message : "Channel query failed",
				layer: "analytics",
				retryable: false,
			});
		}
	}

	async generateReport(
		type: "weekly" | "monthly" | "campaign",
		dateRange: DateRange,
	): Promise<Result<Report>> {
		try {
			const sections: Array<{ title: string; data: Record<string, unknown> }> = [];

			// Funnel section
			const funnelResult = await this.getFunnelMetrics(dateRange);
			if (funnelResult.ok) {
				sections.push({
					title: "Funnel Performance",
					data: {
						stages: funnelResult.data.stages,
						overallConversion: funnelResult.data.overallConversion,
					},
				});
			}

			// Channel performance section
			const channelResult = await this.getChannelPerformance(dateRange);
			if (channelResult.ok) {
				sections.push({
					title: "Channel Performance",
					data: {
						channels: channelResult.data,
					},
				});
			}

			// Traffic overview from GA4 snapshots
			const trafficRows = await this.db
				.select()
				.from(analyticsSnapshots)
				.where(
					and(
						eq(analyticsSnapshots.source, "ga4"),
						eq(analyticsSnapshots.metricType, "traffic"),
						gte(analyticsSnapshots.periodStart, dateRange.start.toISOString()),
						lte(analyticsSnapshots.periodEnd, dateRange.end.toISOString()),
					),
				);

			if (trafficRows.length > 0) {
				const latest = trafficRows[trafficRows.length - 1];
				const values: Record<string, number> = JSON.parse(latest.values);
				sections.push({
					title: "Traffic Overview",
					data: values,
				});
			}

			const report: Report = {
				type,
				dateRange,
				generatedAt: new Date().toISOString(),
				sections,
			};

			return ok(report);
		} catch (e) {
			return err({
				code: "REPORT_GENERATION_FAILED",
				message: e instanceof Error ? e.message : "Report generation failed",
				layer: "analytics",
				retryable: false,
			});
		}
	}
}

function defaultDateRange(): DateRange {
	const end = new Date();
	const start = new Date();
	start.setDate(start.getDate() - 7);
	return { start, end };
}
