import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CreativeService } from "../../src/creative/service.js";

const TEST_OUTPUT_DIR = "./output/__test_creative";

describe("CreativeService", () => {
	const service = new CreativeService({ outputDir: TEST_OUTPUT_DIR });

	function cleanupOutput() {
		if (existsSync(TEST_OUTPUT_DIR)) {
			rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
		}
	}

	beforeEach(() => {
		cleanupOutput();
	});

	afterEach(() => {
		cleanupOutput();
	});

	it("getSpecs returns correct specs for google_ads", () => {
		const specs = service.getSpecs("google_ads");

		expect(specs.channel).toBe("google_ads");
		expect(specs.formats.length).toBeGreaterThanOrEqual(4);

		const searchFormat = specs.formats.find((f) => f.name === "search");
		expect(searchFormat).toBeDefined();
		expect(searchFormat!.headlineMaxChars).toBe(30);
		expect(searchFormat!.bodyMaxChars).toBe(90);

		const displayFormats = specs.formats.filter((f) => f.name === "display");
		expect(displayFormats.length).toBe(3);

		const dimensions = displayFormats.map((f) => f.dimensions);
		expect(dimensions).toContain("300x250");
		expect(dimensions).toContain("728x90");
		expect(dimensions).toContain("160x600");
	});

	it("getSpecs returns correct specs for meta_ads", () => {
		const specs = service.getSpecs("meta_ads");

		expect(specs.channel).toBe("meta_ads");

		const feedFormats = specs.formats.filter((f) => f.name === "feed");
		expect(feedFormats.length).toBe(2);

		const feedDimensions = feedFormats.map((f) => f.dimensions);
		expect(feedDimensions).toContain("1080x1080");
		expect(feedDimensions).toContain("1200x628");

		const stories = specs.formats.find((f) => f.name === "stories");
		expect(stories).toBeDefined();
		expect(stories!.dimensions).toBe("1080x1920");

		const carousel = specs.formats.find((f) => f.name === "carousel");
		expect(carousel).toBeDefined();
		expect(carousel!.dimensions).toBe("1080x1080");
	});

	it("getSpecs returns empty formats for unsupported channel", () => {
		const specs = service.getSpecs("sms");

		expect(specs.channel).toBe("sms");
		expect(specs.formats).toEqual([]);
	});

	it("createBrief generates a brief file", async () => {
		const result = await service.createBrief(
			"google_ads",
			"search",
			[
				{ headline: "Get More Clients", body: "Automate your front desk" },
				{ headline: "AI Receptionist", body: "Never miss a call again" },
			],
			"Clean, professional, blue tones",
		);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const brief = result.data;
		expect(brief.channel).toBe("google_ads");
		expect(brief.format).toBe("search");
		expect(brief.copyVariants.length).toBe(2);
		expect(brief.copyVariants[0].id).toBe(1);
		expect(brief.copyVariants[0].headline).toBe("Get More Clients");
		expect(brief.copyVariants[1].id).toBe(2);
		expect(brief.visualDirection).toBe("Clean, professional, blue tones");
		expect(brief.specs.headlineMaxChars).toBe(30);
		expect(brief.specs.bodyMaxChars).toBe(90);

		// Verify file was created
		expect(existsSync(brief.filePath)).toBe(true);
	});

	it("listBriefs returns created briefs", async () => {
		// Create two briefs
		await service.createBrief(
			"google_ads",
			"search",
			[{ headline: "Test 1", body: "Body 1" }],
			"Direction 1",
		);
		await service.createBrief(
			"meta_ads",
			"feed",
			[{ headline: "Test 2", body: "Body 2" }],
			"Direction 2",
		);

		// List all
		const allBriefs = await service.listBriefs();
		expect(allBriefs.length).toBe(2);

		// List filtered by channel
		const googleBriefs = await service.listBriefs({ channel: "google_ads" });
		expect(googleBriefs.length).toBe(1);
		expect(googleBriefs[0].channel).toBe("google_ads");

		const metaBriefs = await service.listBriefs({ channel: "meta_ads" });
		expect(metaBriefs.length).toBe(1);
		expect(metaBriefs[0].channel).toBe("meta_ads");
	});

	it("listBriefs returns empty array when no briefs exist", async () => {
		const briefs = await service.listBriefs();
		expect(briefs).toEqual([]);
	});
});
