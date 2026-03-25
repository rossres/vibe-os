import { describe, it, expect, beforeAll } from "vitest";
import { BrainService } from "../../src/brain/service.js";
import { existsSync } from "node:fs";

const SOURCE_DOCS_PATH = process.env.SOURCE_DOCS_PATH || "";

describe("Brain integration", () => {
	let brain: BrainService;

	beforeAll(() => {
		brain = new BrainService({ brandConfigPath: "./config/brand.yaml" });
	});

	it("loads brand voice from config", () => {
		const voice = brain.getBrandVoice();
		expect(voice.tone).toBeTruthy();
		expect(voice.vocabulary.prefer.length).toBeGreaterThan(0);
		expect(voice.vocabulary.avoid.length).toBeGreaterThan(0);
	});

	it("loads project name from config", () => {
		const name = brain.getProjectName();
		expect(name).toBeTruthy();
	});

	it("returns canonical narrative", () => {
		const canonical = brain.getCanonical();
		expect(canonical.hero || canonical.promise).toBeTruthy();
	});

	it("returns vertical template for configured verticals", () => {
		const verticals = brain.getAllVerticals();
		if (verticals.length > 0) {
			const template = brain.getVerticalTemplate(verticals[0]);
			expect(template.slug).toBe(verticals[0]);
			expect(template.tier).toMatch(/^[abc]$/);
		}
	});

	it("returns fallback for unknown verticals", () => {
		const template = brain.getVerticalTemplate("unknown-vertical");
		expect(template.slug).toBe("unknown-vertical");
		expect(template.tier).toBe("c");
		expect(template.painPoints).toEqual([]);
	});

	it("returns personas from config", () => {
		const personas = brain.getAllPersonas();
		if (personas.length > 0) {
			const persona = brain.getPersona(personas[0]);
			expect(persona.name).toBe(personas[0]);
		}
	});

	it("returns fallback for unknown personas", () => {
		const persona = brain.getPersona("unknown-persona");
		expect(persona.name).toBe("unknown-persona");
		expect(persona.topPainPoints).toEqual([]);
	});

	it("validates content against banned vocabulary", () => {
		const voice = brain.getBrandVoice();
		if (voice.vocabulary.avoid.length > 0) {
			const bannedWord = voice.vocabulary.avoid[0];
			const failures = brain.validateContent(`This content uses ${bannedWord} everywhere`);
			expect(failures.length).toBeGreaterThan(0);
		}
	});

	it.skipIf(!SOURCE_DOCS_PATH || !existsSync(SOURCE_DOCS_PATH))(
		"ingests source docs successfully",
		async () => {
			const result = await brain.ingestFromSourceDocs(SOURCE_DOCS_PATH);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data.filesProcessed).toBeGreaterThan(0);
			}
		},
		30000,
	);
});
