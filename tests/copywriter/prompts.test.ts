import { describe, it, expect, beforeAll } from "vitest";
import { BrainService } from "../../src/brain/service.js";
import { buildSystemPrompt, buildGenerationPrompt } from "../../src/copywriter/prompts.js";

describe("Prompt Builder", () => {
	let brain: BrainService;

	beforeAll(() => {
		brain = new BrainService({ brandConfigPath: "./config/brand.yaml" });
	});

	describe("buildSystemPrompt", () => {
		it("contains brand voice, pricing, and competitive positioning", () => {
			const prompt = buildSystemPrompt(brain);

			// Brand voice
			expect(prompt).toContain("business coach");
			expect(prompt).toContain("front desk");
			expect(prompt).toContain("AI receptionist");

			// Pricing numbers
			expect(prompt).toContain("$0");
			expect(prompt).toContain("$99");
			expect(prompt).toContain("$149");
			expect(prompt).toContain("60");

			// Competitive positioning
			expect(prompt).toContain("differentiator");
		});
	});

	describe("buildGenerationPrompt", () => {
		it("builds cold email prompt with vertical context and sequence instructions", () => {
			const prompt = buildGenerationPrompt(brain, {
				type: "cold_email",
				vertical: "test-segment-a",
				persona: "sofia",
				stage: "identified",
				variants: 3,
			});

			expect(prompt).toContain("Nail & Beauty Salon");
			expect(prompt).toContain("sofia");
			expect(prompt).toContain("Cold Email Sequence");
			expect(prompt).toContain("150 words");
			expect(prompt).toContain("merge fields");
		});

		it("builds ad copy prompt with platform-specific format specs", () => {
			const prompt = buildGenerationPrompt(brain, {
				type: "ad_copy",
				vertical: "test-segment-c",
				persona: "david",
				stage: "consider",
				platform: "google_ads",
			});

			expect(prompt).toContain("Google Ads");
			expect(prompt).toContain("30 characters");
			expect(prompt).toContain("90 characters");
			expect(prompt).toContain("headlines");
		});

		it("builds social post prompt with platform name", () => {
			const prompt = buildGenerationPrompt(brain, {
				type: "social_post",
				vertical: "test-segment-b",
				persona: "rachel",
				stage: "interested",
				platform: "linkedin_organic",
			});

			expect(prompt).toContain("LinkedIn");
			expect(prompt).toContain("150-300 words");
			expect(prompt).toContain("professional");
		});

		it("builds blog post prompt with keyword and word count", () => {
			const prompt = buildGenerationPrompt(brain, {
				type: "blog_post",
				vertical: "test-segment-d",
				persona: "sofia",
				stage: "aware",
			});

			expect(prompt).toContain("Blog Post");
			expect(prompt).toContain("1500 words");
			expect(prompt).toContain("SEO");
			expect(prompt).toContain("keyword");
		});

		it("includes messaging framework when vertical, persona, and stage are set", () => {
			const prompt = buildGenerationPrompt(brain, {
				type: "cold_email",
				vertical: "test-segment-a",
				persona: "sofia",
				stage: "identified",
			});

			expect(prompt).toContain("Awareness Stage: identified");
			expect(prompt).toContain("Value propositions");
			expect(prompt).toContain("Objection handling");
		});
	});
});
