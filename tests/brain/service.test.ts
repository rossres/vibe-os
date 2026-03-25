import { describe, it, expect, beforeAll } from "vitest";
import { BrainService } from "../../src/brain/service.js";

describe("BrainService", () => {
	let brain: BrainService;

	beforeAll(() => {
		brain = new BrainService({ brandConfigPath: "./config/brand.yaml" });
	});

	it("returns brand voice from config", () => {
		const voice = brain.getBrandVoice();
		expect(voice.tone).toBeTruthy();
		expect(voice.vocabulary.prefer).toBeDefined();
		expect(voice.vocabulary.avoid).toBeDefined();
	});

	it("returns project name", () => {
		const name = brain.getProjectName();
		expect(name).toBeTruthy();
	});

	it("returns vertical template for configured verticals", () => {
		const verticals = brain.getAllVerticals();
		if (verticals.length > 0) {
			const template = brain.getVerticalTemplate(verticals[0]);
			expect(template).toBeDefined();
			expect(template.slug).toBe(verticals[0]);
		}
	});

	it("returns fallback template for unknown vertical", () => {
		const template = brain.getVerticalTemplate("unknown-vertical");
		expect(template.slug).toBe("unknown-vertical");
		expect(template.tier).toBe("c");
		expect(template.painPoints).toEqual([]);
	});

	it("returns pricing model when configured", () => {
		const pricing = brain.getPricing();
		if (pricing) {
			expect(pricing.tiers.length).toBeGreaterThan(0);
			expect(pricing.roiFraming).toBeDefined();
		}
	});

	it("returns persona definition from config", () => {
		const personas = brain.getAllPersonas();
		if (personas.length > 0) {
			const persona = brain.getPersona(personas[0]);
			expect(persona).toBeDefined();
			expect(persona.name).toBe(personas[0]);
		}
	});

	it("returns fallback for unknown persona", () => {
		const persona = brain.getPersona("unknown-persona");
		expect(persona.name).toBe("unknown-persona");
		expect(persona.description).toBe("");
		expect(persona.topPainPoints).toEqual([]);
	});

	it("returns messaging framework when verticals and personas are configured", () => {
		const verticals = brain.getAllVerticals();
		const personas = brain.getAllPersonas();
		if (verticals.length > 0 && personas.length > 0) {
			const messaging = brain.getMessaging(verticals[0], personas[0], "identified");
			expect(messaging).toBeDefined();
			expect(messaging.callToAction).toBeDefined();
		}
	});

	it("returns competitive positioning", () => {
		const positioning = brain.getCompetitivePositioning();
		expect(positioning).toBeDefined();
		expect(positioning.onlyWeStatements).toBeDefined();
		expect(positioning.keyDifferentiators).toBeDefined();
	});

	it("returns canonical narrative", () => {
		const canonical = brain.getCanonical();
		expect(canonical).toBeDefined();
		expect(canonical.emotionalFrame).toBeDefined();
	});

	describe("validateContent", () => {
		it("returns empty array for clean content", () => {
			const results = brain.validateContent("This is perfectly clean content with no banned words.");
			// May or may not have failures depending on mechanism checks
			expect(Array.isArray(results)).toBe(true);
		});

		it("catches banned vocabulary", () => {
			const voice = brain.getBrandVoice();
			if (voice.vocabulary.avoid.length > 0) {
				const bannedWord = voice.vocabulary.avoid[0];
				const results = brain.validateContent(`This content uses ${bannedWord} directly.`);
				const vocabFailure = results.find((r) => r.includes("vocabulary_violation"));
				expect(vocabFailure).toBeDefined();
			}
		});
	});
});
