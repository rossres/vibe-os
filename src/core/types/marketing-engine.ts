import type { PhaseName, VerticalSlug } from "../types";

export interface SystemCharter {
	phase: PhaseName;
	vision: {
		bhag: string;
		purpose: string;
		threeYearPicture: string;
		oneYearRocks: string[];
		quarterlyRock: string;
	};
	primaryGoal: {
		metric: string;
		target: number;
		timelineDays: number;
	};
	verticals: {
		primary: VerticalSlug;
		shadow: VerticalSlug[];
		allocation: Record<string, number>;
	};
	icp: {
		businessTypes?: string[];
		signals: string[];
		disqualifiers: string[];
		employeeRange?: [number, number];
		revenueRange?: [number, number];
	};
	messaging: {
		canonicalPositioning: string;
		canonicalOffer: string;
		allowedClaims: string[];
		forbiddenClaims: string[];
		cta: string;
	};
	channels: {
		active: string[];
		restricted: string[];
		expansionOrder: string[];
		callsAllowed: boolean;
		smsAllowed: boolean;
	};
	testing: {
		minSampleSizeLandingPage: number;
		minSendsOutbound: number;
		minSpendPaid: number;
		confidenceRequired: boolean;
		testAggressiveness: "low" | "medium" | "high";
		oneTestSurfaceAtATime: boolean;
	};
	budget: {
		dailyLimit: number;
		weeklyLimit: number;
		maxDailyOutreachSends: number;
		maxDailySms: number;
		maxDailyCalls: number;
	};
	autonomy: {
		cooCanPauseCampaigns: boolean;
		cooCanReduceSendVolume: boolean;
		cooCanReallocateBudget: boolean;
		maxChannelReallocationPct: number;
		actionsRequiringCeoApproval: string[];
	};
}
