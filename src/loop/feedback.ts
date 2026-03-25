import { getDb } from "../core/db/index.js";
import { icpWeights, accounts, signals } from "../core/db/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { ok, err, type Result } from "../core/errors.js";

export interface FeedbackReport {
	icpWeightsUpdated: number;
	verticalPerformance: Array<{
		vertical: string;
		conversionRate: number;
		avgScore: number;
	}>;
	signalEffectiveness: Array<{
		signalType: string;
		conversionCorrelation: number;
	}>;
	recommendations: string[];
}

export class FeedbackLoopService {
	private db = getDb();

	/**
	 * Analyze which verticals convert best and update ICP weights accordingly.
	 * Looks at accounts that reached "selecting" stage vs total accounts per vertical.
	 */
	async updateICPWeights(): Promise<Result<{ weightsUpdated: number }>> {
		try {
			// Get conversion rates by vertical
			const verticalStats = await this.db
				.select({
					vertical: accounts.vertical,
					total: sql<number>`count(*)`,
					converted: sql<number>`sum(case when ${accounts.stage} = 'selecting' then 1 else 0 end)`,
					avgScore: sql<number>`avg(${accounts.totalScore})`,
				})
				.from(accounts)
				.where(sql`${accounts.vertical} is not null`)
				.groupBy(accounts.vertical);

			let weightsUpdated = 0;

			for (const stat of verticalStats) {
				if (!stat.vertical || stat.total === 0) continue;

				const conversionRate = stat.converted / stat.total;
				// Weight = 0.5 base + up to 1.5 based on conversion rate
				const weight = 0.5 + Math.min(conversionRate * 10, 1.5);

				// Upsert ICP weight
				const existing = await this.db
					.select()
					.from(icpWeights)
					.where(
						and(
							eq(icpWeights.dimension, "vertical"),
							eq(icpWeights.value, stat.vertical)
						)
					)
					.limit(1);

				if (existing.length > 0) {
					await this.db
						.update(icpWeights)
						.set({
							weight,
							source: "analytics_feedback",
							updatedAt: new Date().toISOString(),
						})
						.where(eq(icpWeights.id, existing[0].id));
				} else {
					await this.db.insert(icpWeights).values({
						dimension: "vertical",
						value: stat.vertical,
						weight,
						source: "analytics_feedback",
					});
				}
				weightsUpdated++;
			}

			return ok({ weightsUpdated });
		} catch (error) {
			return err({
				code: "ICP_UPDATE_ERROR",
				message: `Failed to update ICP weights: ${(error as Error).message}`,
				layer: "loop",
				retryable: true,
			});
		}
	}

	/**
	 * Analyze which signal types correlate most with conversions.
	 */
	async analyzeSignalEffectiveness(): Promise<
		Result<Array<{ signalType: string; conversionCorrelation: number }>>
	> {
		try {
			const results = await this.db
				.select({
					signalType: signals.signalType,
					totalAccounts: sql<number>`count(distinct ${signals.accountId})`,
					convertedAccounts: sql<number>`count(distinct case when ${accounts.stage} = 'selecting' then ${signals.accountId} end)`,
				})
				.from(signals)
				.leftJoin(accounts, eq(signals.accountId, accounts.id))
				.groupBy(signals.signalType);

			const effectiveness = results.map((r) => ({
				signalType: r.signalType,
				conversionCorrelation:
					r.totalAccounts > 0
						? r.convertedAccounts / r.totalAccounts
						: 0,
			}));

			return ok(
				effectiveness.sort(
					(a, b) =>
						b.conversionCorrelation - a.conversionCorrelation
				)
			);
		} catch (error) {
			return err({
				code: "SIGNAL_ANALYSIS_ERROR",
				message: `Failed to analyze signals: ${(error as Error).message}`,
				layer: "loop",
				retryable: true,
			});
		}
	}

	/**
	 * Get vertical performance metrics.
	 */
	async getVerticalPerformance(): Promise<
		Result<
			Array<{
				vertical: string;
				total: number;
				converted: number;
				conversionRate: number;
				avgScore: number;
			}>
		>
	> {
		try {
			const stats = await this.db
				.select({
					vertical: accounts.vertical,
					total: sql<number>`count(*)`,
					converted: sql<number>`sum(case when ${accounts.stage} = 'selecting' then 1 else 0 end)`,
					avgScore: sql<number>`avg(${accounts.totalScore})`,
				})
				.from(accounts)
				.where(sql`${accounts.vertical} is not null`)
				.groupBy(accounts.vertical)
				.orderBy(desc(sql`avg(${accounts.totalScore})`));

			return ok(
				stats.map((s) => ({
					vertical: s.vertical!,
					total: s.total,
					converted: s.converted,
					conversionRate:
						s.total > 0 ? s.converted / s.total : 0,
					avgScore: s.avgScore,
				}))
			);
		} catch (error) {
			return err({
				code: "VERTICAL_PERF_ERROR",
				message: `Failed to get vertical performance: ${(error as Error).message}`,
				layer: "loop",
				retryable: true,
			});
		}
	}

	/**
	 * Generate a full feedback report with recommendations.
	 */
	async generateFeedbackReport(): Promise<Result<FeedbackReport>> {
		try {
			const icpResult = await this.updateICPWeights();
			const signalResult = await this.analyzeSignalEffectiveness();
			const verticalResult = await this.getVerticalPerformance();

			if (
				!icpResult.ok ||
				!signalResult.ok ||
				!verticalResult.ok
			) {
				return err({
					code: "FEEDBACK_REPORT_ERROR",
					message: "One or more feedback analyses failed",
					layer: "loop",
					retryable: true,
				});
			}

			// Generate recommendations based on data
			const recommendations: string[] = [];

			// Recommend focusing on top-converting verticals
			const topVerticals = verticalResult.data.filter(
				(v) => v.conversionRate > 0
			);
			if (topVerticals.length > 0) {
				recommendations.push(
					`Focus on ${topVerticals[0].vertical} — highest conversion rate at ${(topVerticals[0].conversionRate * 100).toFixed(1)}%`
				);
			}

			// Recommend high-signal channels
			const topSignals = signalResult.data.filter(
				(s) => s.conversionCorrelation > 0
			);
			if (topSignals.length > 0) {
				recommendations.push(
					`Prioritize "${topSignals[0].signalType}" signals — strongest conversion correlation at ${(topSignals[0].conversionCorrelation * 100).toFixed(1)}%`
				);
			}

			// Recommend de-prioritizing low performers
			const lowVerticals = verticalResult.data.filter(
				(v) => v.total > 5 && v.conversionRate === 0
			);
			for (const v of lowVerticals.slice(0, 3)) {
				recommendations.push(
					`Consider de-prioritizing ${v.vertical} — ${v.total} accounts, 0 conversions`
				);
			}

			return ok({
				icpWeightsUpdated: icpResult.data.weightsUpdated,
				verticalPerformance: verticalResult.data.map((v) => ({
					vertical: v.vertical,
					conversionRate: v.conversionRate,
					avgScore: v.avgScore,
				})),
				signalEffectiveness: signalResult.data,
				recommendations,
			});
		} catch (error) {
			return err({
				code: "FEEDBACK_REPORT_ERROR",
				message: `Failed to generate feedback report: ${(error as Error).message}`,
				layer: "loop",
				retryable: true,
			});
		}
	}
}
