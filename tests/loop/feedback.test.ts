import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq, like, and } from "drizzle-orm";
import { getDb } from "../../src/core/db/index.js";
import { accounts, signals, icpWeights } from "../../src/core/db/schema.js";
import { FeedbackLoopService } from "../../src/loop/feedback.js";

const TEST_PREFIX = "__test_loop_";
const VERT_A = "__test_loop_vert_a";
const VERT_B = "__test_loop_vert_b";

describe("FeedbackLoopService", () => {
	const db = getDb();
	let loop: FeedbackLoopService;

	beforeEach(async () => {
		loop = new FeedbackLoopService();

		// Clean up stale test data from prior runs (reverse FK order)
		const stale = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(like(accounts.name, `${TEST_PREFIX}%`));
		for (const row of stale) {
			await db.delete(signals).where(eq(signals.accountId, row.id));
			await db.delete(accounts).where(eq(accounts.id, row.id));
		}
		// Clean up ICP weights for our test verticals
		await db
			.delete(icpWeights)
			.where(
				and(
					eq(icpWeights.dimension, "vertical"),
					like(icpWeights.value, `${TEST_PREFIX}%`)
				)
			);
	});

	afterEach(async () => {
		// Clean up test data (reverse FK order)
		const testAccounts = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(like(accounts.name, `${TEST_PREFIX}%`));
		for (const row of testAccounts) {
			await db.delete(signals).where(eq(signals.accountId, row.id));
			await db.delete(accounts).where(eq(accounts.id, row.id));
		}
		await db
			.delete(icpWeights)
			.where(
				and(
					eq(icpWeights.dimension, "vertical"),
					like(icpWeights.value, `${TEST_PREFIX}%`)
				)
			);
	});

	it("updateICPWeights creates weights for verticals that have accounts", async () => {
		// Create accounts in two test verticals
		await db.insert(accounts).values([
			{ name: `${TEST_PREFIX}a1`, vertical: VERT_A, stage: "identified" },
			{ name: `${TEST_PREFIX}a2`, vertical: VERT_A, stage: "identified" },
			{ name: `${TEST_PREFIX}a3`, vertical: VERT_B, stage: "identified" },
		]);

		const result = await loop.updateICPWeights();

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.weightsUpdated).toBeGreaterThanOrEqual(2);

		// Verify ICP weights were created for our test verticals
		const vertAWeight = await db
			.select()
			.from(icpWeights)
			.where(
				and(
					eq(icpWeights.dimension, "vertical"),
					eq(icpWeights.value, VERT_A),
					eq(icpWeights.source, "analytics_feedback")
				)
			);
		expect(vertAWeight.length).toBe(1);
		// No conversions, so weight = 0.5 base
		expect(vertAWeight[0].weight).toBe(0.5);
	});

	it("updateICPWeights gives higher weight to verticals with more conversions", async () => {
		// VERT_A: 2 accounts, 1 converted (50% rate)
		await db.insert(accounts).values([
			{ name: `${TEST_PREFIX}b1`, vertical: VERT_A, stage: "selecting" },
			{ name: `${TEST_PREFIX}b2`, vertical: VERT_A, stage: "identified" },
		]);

		// VERT_B: 2 accounts, 0 converted (0% rate)
		await db.insert(accounts).values([
			{ name: `${TEST_PREFIX}b3`, vertical: VERT_B, stage: "identified" },
			{ name: `${TEST_PREFIX}b4`, vertical: VERT_B, stage: "interested" },
		]);

		const result = await loop.updateICPWeights();
		expect(result.ok).toBe(true);

		const vertAWeight = await db
			.select()
			.from(icpWeights)
			.where(
				and(
					eq(icpWeights.dimension, "vertical"),
					eq(icpWeights.value, VERT_A),
					eq(icpWeights.source, "analytics_feedback")
				)
			);
		const vertBWeight = await db
			.select()
			.from(icpWeights)
			.where(
				and(
					eq(icpWeights.dimension, "vertical"),
					eq(icpWeights.value, VERT_B),
					eq(icpWeights.source, "analytics_feedback")
				)
			);

		expect(vertAWeight.length).toBe(1);
		expect(vertBWeight.length).toBe(1);
		// VERT_A has 50% conversion -> weight = 0.5 + min(0.5*10, 1.5) = 2.0
		expect(vertAWeight[0].weight).toBeGreaterThan(vertBWeight[0].weight);
		expect(vertAWeight[0].weight).toBe(2.0);
		// VERT_B has 0% conversion -> weight = 0.5
		expect(vertBWeight[0].weight).toBe(0.5);
	});

	it("analyzeSignalEffectiveness returns signal types sorted by correlation", async () => {
		// Create accounts: one converted, one not — using unique test verticals
		const [converted] = await db
			.insert(accounts)
			.values({
				name: `${TEST_PREFIX}c1`,
				vertical: VERT_A,
				stage: "selecting",
			})
			.returning({ id: accounts.id });
		const [notConverted] = await db
			.insert(accounts)
			.values({
				name: `${TEST_PREFIX}c2`,
				vertical: VERT_A,
				stage: "identified",
			})
			.returning({ id: accounts.id });

		// Use unique signal types so other test/real data doesn't interfere
		const sigTypeHigh = "__test_loop_sig_high";
		const sigTypeLow = "__test_loop_sig_low";

		// High signal only on converted account -> 100% correlation
		await db.insert(signals).values({
			accountId: converted.id,
			source: "manual",
			signalType: sigTypeHigh,
			strength: 1.0,
		});

		// Low signal on both accounts -> 50% correlation
		await db.insert(signals).values([
			{
				accountId: converted.id,
				source: "manual",
				signalType: sigTypeLow,
				strength: 1.0,
			},
			{
				accountId: notConverted.id,
				source: "manual",
				signalType: sigTypeLow,
				strength: 1.0,
			},
		]);

		const result = await loop.analyzeSignalEffectiveness();

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const highSignal = result.data.find((s) => s.signalType === sigTypeHigh);
		const lowSignal = result.data.find((s) => s.signalType === sigTypeLow);

		expect(highSignal).toBeDefined();
		expect(lowSignal).toBeDefined();
		expect(highSignal!.conversionCorrelation).toBe(1.0);
		expect(lowSignal!.conversionCorrelation).toBe(0.5);

		// High should come before low (higher correlation)
		const highIdx = result.data.indexOf(highSignal!);
		const lowIdx = result.data.indexOf(lowSignal!);
		expect(highIdx).toBeLessThan(lowIdx);
	});

	it("getVerticalPerformance returns vertical stats", async () => {
		await db.insert(accounts).values([
			{
				name: `${TEST_PREFIX}d1`,
				vertical: VERT_A,
				stage: "selecting",
				totalScore: 80,
			},
			{
				name: `${TEST_PREFIX}d2`,
				vertical: VERT_A,
				stage: "identified",
				totalScore: 40,
			},
		]);

		const result = await loop.getVerticalPerformance();

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const vertPerf = result.data.find((v) => v.vertical === VERT_A);
		expect(vertPerf).toBeDefined();
		expect(vertPerf!.total).toBe(2);
		expect(vertPerf!.converted).toBe(1);
		expect(vertPerf!.conversionRate).toBe(0.5);
		expect(vertPerf!.avgScore).toBe(60);
	});

	it("generateFeedbackReport returns complete report with recommendations", async () => {
		// Create accounts with varied stages in a unique vertical
		const [converted] = await db
			.insert(accounts)
			.values({
				name: `${TEST_PREFIX}e1`,
				vertical: VERT_A,
				stage: "selecting",
				totalScore: 90,
			})
			.returning({ id: accounts.id });
		await db.insert(accounts).values({
			name: `${TEST_PREFIX}e2`,
			vertical: VERT_A,
			stage: "identified",
			totalScore: 30,
		});

		// Add a signal to the converted account using a unique signal type
		const testSigType = "__test_loop_sig_report";
		await db.insert(signals).values({
			accountId: converted.id,
			source: "manual",
			signalType: testSigType,
			strength: 1.0,
		});

		const result = await loop.generateFeedbackReport();

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const report = result.data;

		// Should have updated at least our test vertical weight
		expect(report.icpWeightsUpdated).toBeGreaterThanOrEqual(1);

		// verticalPerformance should contain our test vertical
		const vertPerf = report.verticalPerformance.find(
			(v) => v.vertical === VERT_A
		);
		expect(vertPerf).toBeDefined();
		expect(vertPerf!.conversionRate).toBeGreaterThan(0);

		// signalEffectiveness should contain our test signal type
		const sigEff = report.signalEffectiveness.find(
			(s) => s.signalType === testSigType
		);
		expect(sigEff).toBeDefined();
		expect(sigEff!.conversionCorrelation).toBeGreaterThan(0);

		// Should have generated recommendations
		expect(report.recommendations.length).toBeGreaterThan(0);
	});
});
