import { Client } from "@notionhq/client";
import { ok, err, type Result } from "../core/errors.js";
import { ingestFile } from "./ingest.js";
import { contentHash } from "./hasher.js";
import { getDb } from "../core/db/index.js";
import { knowledgeEntries } from "../core/db/schema.js";
import { eq } from "drizzle-orm";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// biome-ignore lint/suspicious/noExplicitAny: Notion API types are complex
type NotionBlock = any;
// biome-ignore lint/suspicious/noExplicitAny: Notion API properties vary
type NotionProperties = any;

interface NotionIngestReport {
	pagesProcessed: number;
	entriesCreated: number;
	entriesUpdated: number;
	entriesSkipped: number;
	errors: string[];
}

export function extractNotionPageTitle(properties: NotionProperties): string {
	for (const key of ["title", "Title", "Name", "name"]) {
		const prop = properties[key];
		if (prop?.title?.[0]?.plain_text) {
			return prop.title[0].plain_text;
		}
	}
	return "Untitled";
}

export function parseNotionBlocksToMarkdown(blocks: NotionBlock[]): string {
	let md = "";

	for (const block of blocks) {
		const richText = block[block.type]?.rich_text;
		const text =
			richText?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";

		switch (block.type) {
			case "paragraph":
				md += `${text}\n`;
				break;
			case "heading_1":
				md += `# ${text}\n`;
				break;
			case "heading_2":
				md += `## ${text}\n`;
				break;
			case "heading_3":
				md += `### ${text}\n`;
				break;
			case "bulleted_list_item":
				md += `- ${text}\n`;
				break;
			case "numbered_list_item":
				md += `1. ${text}\n`;
				break;
			case "to_do": {
				const checked = block.to_do?.checked ? "x" : " ";
				md += `- [${checked}] ${text}\n`;
				break;
			}
			case "code":
				md += `\`\`\`${block.code?.language ?? ""}\n${text}\n\`\`\`\n`;
				break;
			case "quote":
				md += `> ${text}\n`;
				break;
			case "divider":
				md += "---\n";
				break;
			case "toggle":
				md += `**${text}**\n`;
				break;
			default:
				if (text) md += `${text}\n`;
		}
	}

	return md;
}

function getNotionClient(): Client {
	const apiKey = process.env.NOTION_API_KEY;
	if (!apiKey) throw new Error("NOTION_API_KEY not set");
	return new Client({ auth: apiKey });
}

export async function ingestNotionDatabase(
	databaseId: string,
	cacheDir: string = "./knowledge/notion"
): Promise<Result<NotionIngestReport>> {
	const report: NotionIngestReport = {
		pagesProcessed: 0,
		entriesCreated: 0,
		entriesUpdated: 0,
		entriesSkipped: 0,
		errors: [],
	};

	try {
		const notion = getNotionClient();
		mkdirSync(cacheDir, { recursive: true });

		let hasMore = true;
		let startCursor: string | undefined;

		while (hasMore) {
			// Use raw request — databases.query was removed in @notionhq/client v5
			const response = await notion.request<{
				results: Array<{ id: string; properties: NotionProperties }>;
				has_more: boolean;
				next_cursor: string | null;
			}>({
				path: `/v1/databases/${databaseId}/query`,
				method: "post",
				body: startCursor ? { start_cursor: startCursor } : {},
			});

			for (const page of response.results) {
				report.pagesProcessed++;
				try {
					const pageId = page.id;
					const title = extractNotionPageTitle(page.properties);

					const blocksResponse = await notion.blocks.children.list({
						block_id: pageId,
					});

					const markdown = parseNotionBlocksToMarkdown(
						blocksResponse.results
					);
					const fullContent = `# ${title}\n\n${markdown}`;

					const safeTitle = title
						.replace(/[^a-z0-9]/gi, "-")
						.toLowerCase();
					const filePath = join(cacheDir, `${safeTitle}.md`);
					writeFileSync(filePath, fullContent, "utf-8");

					// Check for existing entry by cache file path (dedup)
					const hash = contentHash(fullContent);
					const db = getDb();

					const existing = await db
						.select()
						.from(knowledgeEntries)
						.where(eq(knowledgeEntries.sourcePath, filePath))
						.limit(1);

					if (
						existing.length > 0 &&
						existing[0].contentHash === hash
					) {
						report.entriesSkipped++;
						continue;
					}

					const result = await ingestFile(filePath, "notion");
					if (result.ok) {
						if (result.data.created) report.entriesCreated++;
						else if (result.data.updated)
							report.entriesUpdated++;
						else report.entriesSkipped++;
					}
				} catch (pageError) {
					report.errors.push(
						`Page error: ${(pageError as Error).message}`
					);
				}
			}

			hasMore = response.has_more;
			startCursor = response.next_cursor ?? undefined;
		}

		return ok(report);
	} catch (error) {
		return err({
			code: "NOTION_INGEST_ERROR",
			message: `Failed to ingest Notion database: ${(error as Error).message}`,
			layer: "brain",
			retryable: true,
		});
	}
}
