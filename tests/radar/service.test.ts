import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "../../src/core/db/index.js";
import { accounts, signals, stageTransitions } from "../../src/core/db/schema.js";
import { RadarService } from "../../src/radar/service.js";

describe("RadarService", () => {
	const db = getDb();
	let radar: RadarService;
	let testAccountId: number;

	beforeEach(async () => {
		radar = new RadarService({ db });

		// Create a test account
		const rows = await db
			.insert(accounts)
			.values({
				name: "__test_radar_account__",
				vertical: "test-segment-a",
				employeeCount: "5",
				reviewCount: 30,
				googleRating: 4.2,
			})
			.returning({ id: accounts.id });
		testAccountId = rows[0].id;
	});

	afterEach(async () => {
		// Clean up test data in correct order (foreign key deps)
		await db
			.delete(stageTransitions)
			.where(eq(stageTransitions.accountId, testAccountId));
		await db.delete(signals).where(eq(signals.accountId, testAccountId));
		await db.delete(accounts).where(eq(accounts.id, testAccountId));
	});

	it("getTargetList returns empty array when no accounts match impossible filter", async () => {
		const results = await radar.getTargetList({
			vertical: "__nonexistent_vertical__",
		});
		expect(results).toEqual([]);
	});

	it("addSignal creates a signal record", async () => {
		const signalId = await radar.addSignal(testAccountId, {
			source: "google_reviews",
			sourceId: "test-signal-1",
			signalType: "missed_call_review",
			strength: 1.0,
			rawData: JSON.stringify({ text: "They never answer the phone" }),
		});

		expect(signalId).toBeGreaterThan(0);

		// Verify signal was created
		const accountSignals = await radar.getAccountSignals(testAccountId);
		expect(accountSignals.length).toBe(1);
		expect(accountSignals[0].signalType).toBe("missed_call_review");
		expect(accountSignals[0].source).toBe("google_reviews");
	});

	it("addSignal prevents duplicates based on source + sourceId + signalType", async () => {
		const firstId = await radar.addSignal(testAccountId, {
			source: "google_reviews",
			sourceId: "dup-test-1",
			signalType: "missed_call_review",
			strength: 1.0,
		});

		const secondId = await radar.addSignal(testAccountId, {
			source: "google_reviews",
			sourceId: "dup-test-1",
			signalType: "missed_call_review",
			strength: 1.0,
		});

		expect(firstId).toBe(secondId);

		const accountSignals = await radar.getAccountSignals(testAccountId);
		expect(accountSignals.length).toBe(1);
	});

	it("scoreAndUpdateAccount updates the account's score fields", async () => {
		// Add a signal first
		await radar.addSignal(testAccountId, {
			source: "demo_call",
			signalType: "demo_call",
			strength: 1.0,
		});

		// Fetch the updated account
		const accountRows = await db
			.select()
			.from(accounts)
			.where(eq(accounts.id, testAccountId))
			.limit(1);

		const account = accountRows[0];
		expect(account.fitScore).toBeGreaterThan(0);
		expect(account.intentScore).toBeGreaterThan(0);
		expect(account.totalScore).toBeGreaterThan(0);
		expect(account.tier).toBeDefined();
		// demo_call should move stage to "consider"
		expect(account.stage).toBe("consider");
	});

	it("scoreAndUpdateAccount creates stage transition when stage changes", async () => {
		// Account starts at "identified" (default)
		await radar.addSignal(testAccountId, {
			source: "demo_call",
			signalType: "demo_call",
			strength: 1.0,
		});

		const transitions = await db
			.select()
			.from(stageTransitions)
			.where(eq(stageTransitions.accountId, testAccountId));

		expect(transitions.length).toBe(1);
		expect(transitions[0].fromStage).toBe("identified");
		expect(transitions[0].toStage).toBe("consider");
	});
});
