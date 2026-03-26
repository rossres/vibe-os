import { describe, it, expect } from "vitest";
import { loadBrandConfig, loadPlatformConfig } from "../../src/core/config.js";

describe("Config loader", () => {
	it("loads brand config from yaml", () => {
		const brand = loadBrandConfig("./config/brand.yaml");
		expect(brand.voice.tone).toBeDefined();
		expect(brand.verticals.tier_a).toContain("test-segment-a");
		expect(brand.personas.primary).toBe("sofia");
	});

	it("loads platform config from yaml", () => {
		const platforms = loadPlatformConfig("./config/platforms.yaml");
		expect(platforms.posthog).toBeDefined();
		expect(platforms.posthog.host).toContain("posthog.com");
	});
});
