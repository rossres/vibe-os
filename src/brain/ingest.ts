import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "../core/db/index.js";
import { knowledgeEntries } from "../core/db/schema.js";
import { contentHash } from "./hasher.js";
import type { KnowledgeCategory } from "../core/types.js";
import { ok, err, type Result } from "../core/errors.js";

interface IngestReport {
	filesProcessed: number;
	entriesCreated: number;
	entriesUpdated: number;
	entriesSkipped: number;
	errors: string[];
}

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: KnowledgeCategory }> = [
	{ pattern: /brand[_-]?voice|tone|vocabulary/i, category: "brand_voice" },
	{ pattern: /pricing|price|tier|cost/i, category: "pricing" },
	{ pattern: /competitive|competitor|versus|vs\b|gap/i, category: "competitive" },
	{ pattern: /persona|icp|buyer/i, category: "persona" },
	{ pattern: /template|email[_-]?template|sequence/i, category: "template" },
	{ pattern: /vertical[_-]?playbook|segment|market/i, category: "vertical" },
	{ pattern: /sop|workflow|funnel|playbook|automation/i, category: "sop" },
	{ pattern: /messaging|narrative|headline|copy|positioning/i, category: "messaging" },
];

export function categorizeDocument(filename: string, content: string): KnowledgeCategory {
	const combined = `${filename}\n${content.slice(0, 2000)}`;
	for (const { pattern, category } of CATEGORY_PATTERNS) {
		if (pattern.test(combined)) return category;
	}
	return "messaging";
}

function extractSubcategory(filename: string, content: string): string | undefined {
	// Extract subcategory from content — looks for vertical/segment markers
	const verticalMatch = content.match(/vertical:\s*(\S+)/i) || content.match(/segment:\s*(\S+)/i);
	if (verticalMatch) return verticalMatch[1].toLowerCase();
	return undefined;
}

export async function ingestFile(
	filePath: string,
	sourceType: "file" | "notion" | "manual" = "file"
): Promise<Result<{ created: boolean; updated: boolean }>> {
	try {
		const content = readFileSync(filePath, "utf-8");
		const filename = basename(filePath);
		const hash = contentHash(content);
		const category = categorizeDocument(filename, content);
		const subcategory = extractSubcategory(filename, content);
		const title = filename.replace(extname(filename), "").replace(/[-_]/g, " ");
		const db = getDb();

		const existing = await db
			.select()
			.from(knowledgeEntries)
			.where(eq(knowledgeEntries.sourcePath, filePath))
			.limit(1);

		if (existing.length > 0) {
			if (existing[0].contentHash === hash) {
				return ok({ created: false, updated: false });
			}
			await db
				.update(knowledgeEntries)
				.set({
					body: content,
					contentHash: hash,
					category,
					subcategory,
					version: existing[0].version + 1,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(knowledgeEntries.id, existing[0].id));
			return ok({ created: false, updated: true });
		}

		await db.insert(knowledgeEntries).values({
			category,
			subcategory,
			title,
			body: content,
			sourcePath: filePath,
			sourceType,
			contentHash: hash,
		});

		return ok({ created: true, updated: false });
	} catch (error) {
		return err({
			code: "INGEST_FILE_ERROR",
			message: `Failed to ingest ${filePath}: ${(error as Error).message}`,
			layer: "brain",
			retryable: false,
			context: { filePath },
		});
	}
}

export async function ingestDirectory(dirPath: string): Promise<Result<IngestReport>> {
	const report: IngestReport = {
		filesProcessed: 0,
		entriesCreated: 0,
		entriesUpdated: 0,
		entriesSkipped: 0,
		errors: [],
	};

	try {
		const files = collectMarkdownFiles(dirPath);

		for (const file of files) {
			report.filesProcessed++;
			const result = await ingestFile(file);
			if (result.ok) {
				if (result.data.created) report.entriesCreated++;
				else if (result.data.updated) report.entriesUpdated++;
				else report.entriesSkipped++;
			} else {
				report.errors.push(result.error.message);
			}
		}

		return ok(report);
	} catch (error) {
		return err({
			code: "INGEST_DIR_ERROR",
			message: `Failed to ingest directory ${dirPath}: ${(error as Error).message}`,
			layer: "brain",
			retryable: false,
		});
	}
}

function collectMarkdownFiles(dirPath: string): string[] {
	const files: string[] = [];
	const entries = readdirSync(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dirPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectMarkdownFiles(fullPath));
		} else if (entry.name.endsWith(".md") || entry.name.endsWith(".csv")) {
			files.push(fullPath);
		}
	}

	return files;
}
