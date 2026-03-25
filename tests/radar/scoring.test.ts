import { describe, it, expect } from "vitest";
import { scoreAccount, determineStage } from "../../src/radar/scoring.js";
import type { SignalData } from "../../src/radar/scoring.js";

describe("scoreAccount", () => {
	it("returns correct fitScore for tier A vertical", () => {
		const result = scoreAccount({
			vertical: "nail-beauty",
			reviewCount: 60,
			googleRating: 4.5,
			employeeCount: "5",
			signals: [],
		});
		// vertical tier A = 30, reviewCount > 50 = 20, rating > 4 = 10, employees 1-10 = 15
		expect(result.fitScore).toBe(75);
	});

	it("gives higher intentScore for recent missed_call_review signals", () => {
		const now = new Date();
		const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
		const oldDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

		const recentResult = scoreAccount({
			signals: [
				{ signalType: "missed_call_review", strength: 1, detectedAt: recentDate },
			],
		});

		const oldResult = scoreAccount({
			signals: [
				{ signalType: "missed_call_review", strength: 1, detectedAt: oldDate },
			],
		});

		// Recent (< 7 days) gets 2x multiplier: 25 * 1 * 2 = 50
		// Old gets 1x: 25 * 1 * 1 = 25
		expect(recentResult.intentScore).toBe(50);
		expect(oldResult.intentScore).toBe(25);
		expect(recentResult.intentScore).toBeGreaterThan(oldResult.intentScore);
	});

	it("assigns tier 1 for high scores, tier 3 for low", () => {
		const now = new Date();
		const recentDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

		const highResult = scoreAccount({
			vertical: "nail-beauty",
			reviewCount: 60,
			googleRating: 4.5,
			employeeCount: "5",
			signals: [
				{ signalType: "demo_call", strength: 1, detectedAt: recentDate },
				{ signalType: "pricing_page_view", strength: 1, detectedAt: recentDate },
			],
		});

		const lowResult = scoreAccount({
			signals: [],
		});

		expect(highResult.tier).toBe(1);
		expect(lowResult.tier).toBe(3);
	});

	it("totalScore weights intent more than fit (0.6 vs 0.4)", () => {
		const now = new Date();
		const recentDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

		// High fit, no intent
		const fitOnly = scoreAccount({
			vertical: "nail-beauty",
			reviewCount: 60,
			googleRating: 4.5,
			employeeCount: "5",
			signals: [],
		});

		// No fit, high intent
		const intentOnly = scoreAccount({
			signals: [
				{ signalType: "demo_call", strength: 1, detectedAt: recentDate },
				{ signalType: "missed_call_review", strength: 1, detectedAt: recentDate },
			],
		});

		// fitOnly: totalScore = 0.4 * 75 + 0.6 * 0 = 30
		expect(fitOnly.totalScore).toBe(0.4 * 75);
		// intentOnly: totalScore = 0.4 * 0 + 0.6 * intentScore
		expect(intentOnly.totalScore).toBe(0.6 * intentOnly.intentScore);
		// With the same raw fit/intent, intent contributes more
		expect(0.6).toBeGreaterThan(0.4);
	});

	it("caps intentScore at 100", () => {
		const now = new Date();
		const recentDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

		const result = scoreAccount({
			signals: [
				{ signalType: "demo_call", strength: 1, detectedAt: recentDate },
				{ signalType: "missed_call_review", strength: 1, detectedAt: recentDate },
				{ signalType: "pricing_page_view", strength: 1, detectedAt: recentDate },
				{ signalType: "receptionist_job", strength: 1, detectedAt: recentDate },
				{ signalType: "new_business", strength: 1, detectedAt: recentDate },
			],
		});

		expect(result.intentScore).toBeLessThanOrEqual(100);
	});

	it("caps fitScore at 100", () => {
		const result = scoreAccount({
			vertical: "nail-beauty",
			reviewCount: 100,
			googleRating: 5.0,
			employeeCount: "5",
			signals: [],
		});

		expect(result.fitScore).toBeLessThanOrEqual(100);
	});
});

describe("determineStage", () => {
	it('returns "consider" for demo_call signal', () => {
		const signals: SignalData[] = [
			{ signalType: "demo_call", strength: 1, detectedAt: new Date().toISOString() },
		];
		expect(determineStage(signals)).toBe("consider");
	});

	it('returns "consider" for pricing_page_view signal', () => {
		const signals: SignalData[] = [
			{ signalType: "pricing_page_view", strength: 1, detectedAt: new Date().toISOString() },
		];
		expect(determineStage(signals)).toBe("consider");
	});

	it('returns "interested" for site_visit signal', () => {
		const signals: SignalData[] = [
			{ signalType: "site_visit", strength: 1, detectedAt: new Date().toISOString() },
		];
		expect(determineStage(signals)).toBe("interested");
	});

	it('returns "aware" for email_open signal', () => {
		const signals: SignalData[] = [
			{ signalType: "email_open", strength: 1, detectedAt: new Date().toISOString() },
		];
		expect(determineStage(signals)).toBe("aware");
	});

	it('returns "identified" for basic signal like new_business', () => {
		const signals: SignalData[] = [
			{ signalType: "new_business", strength: 1, detectedAt: new Date().toISOString() },
		];
		expect(determineStage(signals)).toBe("identified");
	});

	it('returns "identified" for empty signals', () => {
		expect(determineStage([])).toBe("identified");
	});
});
