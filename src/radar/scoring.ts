import type { AwarenessStage, SignalType, VerticalSlug } from "../core/types.js";

export interface SignalData {
	signalType: SignalType;
	strength: number;
	detectedAt: string;
}

export interface ScoringInput {
	vertical?: VerticalSlug;
	employeeCount?: string;
	reviewCount?: number;
	googleRating?: number;
	signals: SignalData[];
}

export interface AccountScore {
	fitScore: number;
	intentScore: number;
	totalScore: number;
	tier: 1 | 2 | 3;
}

// Tier A/B verticals are loaded from config at runtime.
// These defaults are empty — the BrainService populates them from brand.yaml.
let TIER_A_VERTICALS: VerticalSlug[] = [];
let TIER_B_VERTICALS: VerticalSlug[] = [];

/** Called by the engine to set tier verticals from config */
export function setTierVerticals(tierA: VerticalSlug[], tierB: VerticalSlug[]): void {
	TIER_A_VERTICALS = tierA;
	TIER_B_VERTICALS = tierB;
}

const SIGNAL_BASE_VALUES: Partial<Record<SignalType, number>> = {
	missed_call_review: 25,
	receptionist_job: 20,
	demo_call: 30,
	pricing_page_view: 20,
	email_open: 5,
	site_visit: 10,
	new_business: 15,
	email_click: 10,
	email_reply: 15,
	new_location: 10,
	negative_phone_review: 20,
	voicemail_full: 15,
};

function getVerticalScore(vertical?: VerticalSlug): number {
	if (!vertical) return 0;
	if (TIER_A_VERTICALS.includes(vertical)) return 30;
	if (TIER_B_VERTICALS.includes(vertical)) return 20;
	return 10;
}

function getReviewScore(reviewCount?: number): number {
	if (reviewCount == null) return 0;
	if (reviewCount > 50) return 20;
	if (reviewCount > 20) return 10;
	return 0;
}

function getRatingScore(googleRating?: number): number {
	if (googleRating == null) return 0;
	if (googleRating > 4) return 10;
	if (googleRating > 3) return 5;
	return 0;
}

function getEmployeeScore(employeeCount?: string): number {
	if (!employeeCount) return 0;
	const match = employeeCount.match(/^(\d+)/);
	if (!match) return 0;
	const count = Number.parseInt(match[1], 10);
	if (count >= 1 && count <= 10) return 15;
	if (count >= 11 && count <= 50) return 10;
	return 0;
}

function daysBetween(dateStr: string, now: Date): number {
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	return diffMs / (1000 * 60 * 60 * 24);
}

export function scoreAccount(input: ScoringInput): AccountScore {
	const fitScore = Math.min(
		100,
		getVerticalScore(input.vertical) +
			getReviewScore(input.reviewCount) +
			getRatingScore(input.googleRating) +
			getEmployeeScore(input.employeeCount),
	);

	const now = new Date();
	let rawIntent = 0;
	for (const signal of input.signals) {
		const base = SIGNAL_BASE_VALUES[signal.signalType] ?? 5;
		const weighted = base * signal.strength;
		const age = daysBetween(signal.detectedAt, now);
		const recencyMultiplier = age < 7 ? 2 : 1;
		rawIntent += weighted * recencyMultiplier;
	}
	const intentScore = Math.min(100, rawIntent);

	const totalScore = 0.4 * fitScore + 0.6 * intentScore;

	let tier: 1 | 2 | 3;
	if (totalScore >= 70) {
		tier = 1;
	} else if (totalScore >= 40) {
		tier = 2;
	} else {
		tier = 3;
	}

	return { fitScore, intentScore, totalScore, tier };
}

export function determineStage(signals: SignalData[]): AwarenessStage {
	const types = new Set(signals.map((s) => s.signalType));

	if (types.has("demo_call") || types.has("pricing_page_view")) {
		return "consider";
	}
	if (types.has("email_click") || types.has("site_visit")) {
		return "interested";
	}
	if (types.has("email_open")) {
		return "aware";
	}
	return "identified";
}
