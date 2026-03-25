import { describe, it, expect } from "vitest";
import {
	getPlaysForStage,
	getPlaysForChannel,
	STAGE_PLAYBOOK,
	type CampaignPlay,
} from "../../src/campaigns/playbook.js";
import type { AwarenessStage } from "../../src/core/types.js";

const ALL_STAGES: AwarenessStage[] = [
	"identified",
	"aware",
	"interested",
	"consider",
	"selecting",
];

describe("Campaign Playbook", () => {
	it("getPlaysForStage returns plays for each stage", () => {
		for (const stage of ALL_STAGES) {
			const plays = getPlaysForStage(stage);
			expect(Array.isArray(plays)).toBe(true);
			expect(plays.length).toBeGreaterThan(0);
			for (const play of plays) {
				expect(play.stage).toBe(stage);
			}
		}
	});

	it("getPlaysForChannel('google_ads') returns google ads plays", () => {
		const plays = getPlaysForChannel("google_ads");
		expect(plays.length).toBeGreaterThan(0);
		for (const play of plays) {
			expect(play.channels).toContain("google_ads");
		}
	});

	it("all stages have at least one play", () => {
		for (const stage of ALL_STAGES) {
			const plays = STAGE_PLAYBOOK[stage];
			expect(plays.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("plays have required fields (id, name, channels, stage, objective)", () => {
		const allPlays = Object.values(STAGE_PLAYBOOK).flat();
		for (const play of allPlays) {
			expect(typeof play.id).toBe("string");
			expect(play.id.length).toBeGreaterThan(0);
			expect(typeof play.name).toBe("string");
			expect(play.name.length).toBeGreaterThan(0);
			expect(Array.isArray(play.channels)).toBe(true);
			expect(play.channels.length).toBeGreaterThan(0);
			expect(typeof play.stage).toBe("string");
			expect(typeof play.objective).toBe("string");
			expect(typeof play.description).toBe("string");
		}
	});

	it("getPlaysForChannel returns plays across multiple stages", () => {
		const emailPlays = getPlaysForChannel("email");
		const stages = new Set(emailPlays.map((p) => p.stage));
		expect(stages.size).toBeGreaterThan(1);
	});
});
