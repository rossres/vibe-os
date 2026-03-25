import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Channel } from "../core/types.js";
import { ok, err, type Result } from "../core/errors.js";

export interface CreativeBrief {
	id: string;
	channel: Channel;
	format: string;
	dimensions?: string;
	specs: Record<string, string | number>;
	copyVariants: Array<{ id: number; headline: string; body: string }>;
	visualDirection: string;
	filePath: string;
}

export interface PlatformSpec {
	channel: Channel;
	formats: Array<{
		name: string;
		dimensions: string;
		headlineMaxChars: number;
		bodyMaxChars: number;
		notes: string;
	}>;
}

const PLATFORM_SPECS: Record<string, PlatformSpec> = {
	google_ads: {
		channel: "google_ads",
		formats: [
			{
				name: "search",
				dimensions: "text-only",
				headlineMaxChars: 30,
				bodyMaxChars: 90,
				notes: "Up to 15 headlines and 4 descriptions per responsive search ad",
			},
			{
				name: "display",
				dimensions: "300x250",
				headlineMaxChars: 30,
				bodyMaxChars: 90,
				notes: "Medium rectangle banner",
			},
			{
				name: "display",
				dimensions: "728x90",
				headlineMaxChars: 30,
				bodyMaxChars: 90,
				notes: "Leaderboard banner",
			},
			{
				name: "display",
				dimensions: "160x600",
				headlineMaxChars: 30,
				bodyMaxChars: 90,
				notes: "Wide skyscraper banner",
			},
		],
	},
	meta_ads: {
		channel: "meta_ads",
		formats: [
			{
				name: "feed",
				dimensions: "1080x1080",
				headlineMaxChars: 40,
				bodyMaxChars: 125,
				notes: "Square feed image",
			},
			{
				name: "feed",
				dimensions: "1200x628",
				headlineMaxChars: 40,
				bodyMaxChars: 125,
				notes: "Landscape feed image",
			},
			{
				name: "stories",
				dimensions: "1080x1920",
				headlineMaxChars: 40,
				bodyMaxChars: 125,
				notes: "Full-screen vertical stories format",
			},
			{
				name: "carousel",
				dimensions: "1080x1080",
				headlineMaxChars: 40,
				bodyMaxChars: 125,
				notes: "Per-card dimensions for carousel ads",
			},
		],
	},
	linkedin_ads: {
		channel: "linkedin_ads",
		formats: [
			{
				name: "sponsored",
				dimensions: "1200x627",
				headlineMaxChars: 70,
				bodyMaxChars: 150,
				notes: "Single image sponsored content",
			},
			{
				name: "inmail",
				dimensions: "none",
				headlineMaxChars: 60,
				bodyMaxChars: 1500,
				notes: "No image required for InMail",
			},
		],
	},
	instagram: {
		channel: "instagram",
		formats: [
			{
				name: "post",
				dimensions: "1080x1080",
				headlineMaxChars: 40,
				bodyMaxChars: 2200,
				notes: "Square post format",
			},
			{
				name: "story",
				dimensions: "1080x1920",
				headlineMaxChars: 40,
				bodyMaxChars: 200,
				notes: "Full-screen vertical story",
			},
			{
				name: "reel",
				dimensions: "1080x1920",
				headlineMaxChars: 40,
				bodyMaxChars: 2200,
				notes: "Full-screen vertical reel",
			},
		],
	},
};

const DEFAULT_OUTPUT_DIR = "./output";

export class CreativeService {
	private outputDir: string;

	constructor(options?: { outputDir?: string }) {
		this.outputDir = options?.outputDir ?? DEFAULT_OUTPUT_DIR;
	}

	getSpecs(channel: Channel): PlatformSpec {
		const specs = PLATFORM_SPECS[channel];
		if (specs) {
			return specs;
		}

		// Return empty spec for unsupported channels
		return {
			channel,
			formats: [],
		};
	}

	async createBrief(
		channel: Channel,
		format: string,
		copyVariants: Array<{ headline: string; body: string }>,
		visualDirection: string,
	): Promise<Result<CreativeBrief>> {
		try {
			const specs = this.getSpecs(channel);
			const matchingFormat = specs.formats.find((f) => f.name === format);

			const briefId = `${channel}-${format}-${Date.now()}`;
			const dirPath = join(this.outputDir, "creative", channel, format);
			const filePath = join(dirPath, `${briefId}.json`);

			const specsRecord: Record<string, string | number> = {};
			if (matchingFormat) {
				specsRecord.dimensions = matchingFormat.dimensions;
				specsRecord.headlineMaxChars = matchingFormat.headlineMaxChars;
				specsRecord.bodyMaxChars = matchingFormat.bodyMaxChars;
				specsRecord.notes = matchingFormat.notes;
			}

			const numberedVariants = copyVariants.map((v, i) => ({
				id: i + 1,
				headline: v.headline,
				body: v.body,
			}));

			const brief: CreativeBrief = {
				id: briefId,
				channel,
				format,
				dimensions: matchingFormat?.dimensions,
				specs: specsRecord,
				copyVariants: numberedVariants,
				visualDirection,
				filePath,
			};

			mkdirSync(dirPath, { recursive: true });
			writeFileSync(filePath, JSON.stringify(brief, null, 2), "utf-8");

			return ok(brief);
		} catch (e) {
			return err({
				code: "CREATIVE_BRIEF_FAILED",
				message: e instanceof Error ? e.message : "Failed to create brief",
				layer: "creative",
				retryable: false,
			});
		}
	}

	async listBriefs(filters?: { channel?: Channel }): Promise<CreativeBrief[]> {
		const briefs: CreativeBrief[] = [];
		const creativeDir = join(this.outputDir, "creative");

		if (!existsSync(creativeDir)) {
			return briefs;
		}

		const channels = readdirSync(creativeDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name);

		for (const ch of channels) {
			if (filters?.channel && ch !== filters.channel) {
				continue;
			}

			const channelDir = join(creativeDir, ch);
			const formats = readdirSync(channelDir, { withFileTypes: true })
				.filter((d) => d.isDirectory())
				.map((d) => d.name);

			for (const fmt of formats) {
				const formatDir = join(channelDir, fmt);
				const files = readdirSync(formatDir)
					.filter((f) => f.endsWith(".json"));

				for (const file of files) {
					try {
						const filePath = join(formatDir, file);
						const raw = readFileSync(filePath, "utf-8");
						const brief = JSON.parse(raw) as CreativeBrief;
						briefs.push(brief);
					} catch {
						// Skip files that can't be parsed
					}
				}
			}
		}

		return briefs;
	}
}
