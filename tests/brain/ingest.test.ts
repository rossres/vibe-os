import { describe, it, expect } from "vitest";
import { categorizeDocument } from "../../src/brain/ingest.js";
import { contentHash } from "../../src/brain/hasher.js";

describe("Document categorization", () => {
	it("categorizes marketing stack as messaging", () => {
		const category = categorizeDocument(
			"marketing-stack-2026-03-10.md",
			"## Messaging Framework\n### Core Narrative Arc"
		);
		expect(category).toBe("messaging");
	});

	it("categorizes pricing doc as pricing", () => {
		const category = categorizeDocument("scale_pricing.md", "## Pricing Tiers\nFlex: $20");
		expect(category).toBe("pricing");
	});

	it("categorizes competitive analysis as competitive", () => {
		const category = categorizeDocument(
			"heyrosie-competitive-analysis.md",
			"## Competitive Analysis\nCompetitor A vs Our Product"
		);
		expect(category).toBe("competitive");
	});

	it("categorizes vertical playbook as vertical", () => {
		const category = categorizeDocument(
			"vertical-playbooks.md",
			"## Nail/Beauty\nTop 3 moves"
		);
		expect(category).toBe("vertical");
	});

	it("categorizes email templates as template", () => {
		const category = categorizeDocument(
			"email-templates.md",
			"## Cold Email Sequences\n### HVAC"
		);
		expect(category).toBe("template");
	});

	it("categorizes SOP docs as sop", () => {
		const category = categorizeDocument(
			"full-funnel-sop.md",
			"## Stage 1: Scrape\n## Stage 2: Enrich"
		);
		expect(category).toBe("sop");
	});
});

describe("Content hashing", () => {
	it("produces consistent hashes", () => {
		const hash1 = contentHash("hello world");
		const hash2 = contentHash("hello world");
		expect(hash1).toBe(hash2);
	});

	it("produces different hashes for different content", () => {
		const hash1 = contentHash("hello world");
		const hash2 = contentHash("goodbye world");
		expect(hash1).not.toBe(hash2);
	});
});
