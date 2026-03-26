import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { rmSync } from "node:fs";

vi.mock("@anthropic-ai/sdk", () => {
	return {
		default: class MockAnthropic {
			messages = {
				create: vi.fn().mockResolvedValue({
					content: [
						{
							type: "text",
							text: JSON.stringify({
								variants: [
									{
										id: 1,
										content: {
											subject: "Test Subject",
											body: "Test body copy",
										},
									},
									{
										id: 2,
										content: {
											subject: "Test Subject 2",
											body: "Test body 2",
										},
									},
									{
										id: 3,
										content: {
											subject: "Test Subject 3",
											body: "Test body 3",
										},
									},
								],
							}),
						},
					],
					usage: { input_tokens: 500, output_tokens: 200 },
				}),
			};
		},
	};
});

import { BrainService } from "../../src/brain/service.js";
import { CopywriterService } from "../../src/copywriter/service.js";

const TEST_OUTPUT_DIR = "output/test-copywriter";

describe("CopywriterService", () => {
	let brain: BrainService;
	let copywriter: CopywriterService;

	beforeAll(() => {
		brain = new BrainService({ brandConfigPath: "./config/brand.yaml" });
		copywriter = new CopywriterService({
			brain,
			outputDir: TEST_OUTPUT_DIR,
		});
	});

	afterAll(() => {
		try {
			rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it("generates cold_email content with variants", async () => {
		const result = await copywriter.generate({
			type: "cold_email",
			vertical: "test-segment-a",
			persona: "sofia",
			stage: "identified",
			variants: 3,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.contentType).toBe("cold_email");
		expect(result.data.variants).toHaveLength(3);
		expect(result.data.variants[0].content).toHaveProperty("subject");
		expect(result.data.model).toBe("claude-sonnet-4-20250514");
		expect(result.data.tokensUsed.input).toBe(500);
		expect(result.data.tokensUsed.output).toBe(200);
		expect(result.data.filePath).toContain("cold_email");
	});

	it("generates ad_copy content", async () => {
		const result = await copywriter.generate({
			type: "ad_copy",
			vertical: "test-segment-c",
			persona: "david",
			stage: "consider",
			platform: "google_ads",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.contentType).toBe("ad_copy");
		expect(result.data.variants.length).toBeGreaterThan(0);
	});

	it("generates social_post content", async () => {
		const result = await copywriter.generate({
			type: "social_post",
			vertical: "test-segment-b",
			persona: "rachel",
			stage: "interested",
			platform: "linkedin_organic",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.contentType).toBe("social_post");
		expect(result.data.variants.length).toBeGreaterThan(0);
	});

	it("generates blog_post content", async () => {
		const result = await copywriter.generate({
			type: "blog_post",
			vertical: "test-segment-d",
			persona: "sofia",
			stage: "aware",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.contentType).toBe("blog_post");
		expect(result.data.generatedAt).toBeDefined();
	});

	it("generates sms content", async () => {
		const result = await copywriter.generate({
			type: "sms",
			vertical: "test-segment-c",
			persona: "sofia",
			stage: "selecting",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.contentType).toBe("sms");
		expect(result.data.filePath).toContain("sms");
	});

	it("saves output to file system", async () => {
		const result = await copywriter.generate({
			type: "cold_email",
			vertical: "test-segment-a",
			persona: "sofia",
			stage: "identified",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.filePath).toContain(TEST_OUTPUT_DIR);
		expect(result.data.filePath).toMatch(/\.json$/);
	});

	it("revises previous output with feedback", async () => {
		const original = await copywriter.generate({
			type: "cold_email",
			vertical: "test-segment-a",
			persona: "sofia",
			stage: "identified",
		});

		expect(original.ok).toBe(true);
		if (!original.ok) return;

		const revised = await copywriter.revise(
			original.data,
			"Make the tone more urgent and add a discount offer",
		);

		expect(revised.ok).toBe(true);
		if (!revised.ok) return;
		expect(revised.data.contentType).toBe("cold_email");
		expect(revised.data.filePath).toContain("revised");
	});
});
