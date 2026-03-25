import { describe, it, expect } from "vitest";
import { parseNotionBlocksToMarkdown, extractNotionPageTitle } from "../../src/brain/notion.js";

describe("Notion content parsing", () => {
	it("converts paragraph blocks to markdown", () => {
		const blocks = [
			{
				type: "paragraph",
				paragraph: {
					rich_text: [{ plain_text: "Hello world", annotations: {} }],
				},
			},
		];
		const md = parseNotionBlocksToMarkdown(blocks);
		expect(md).toBe("Hello world\n");
	});

	it("converts heading blocks to markdown", () => {
		const blocks = [
			{
				type: "heading_1",
				heading_1: {
					rich_text: [{ plain_text: "Title", annotations: {} }],
				},
			},
			{
				type: "heading_2",
				heading_2: {
					rich_text: [{ plain_text: "Subtitle", annotations: {} }],
				},
			},
		];
		const md = parseNotionBlocksToMarkdown(blocks);
		expect(md).toContain("# Title");
		expect(md).toContain("## Subtitle");
	});

	it("converts bulleted list blocks", () => {
		const blocks = [
			{
				type: "bulleted_list_item",
				bulleted_list_item: {
					rich_text: [{ plain_text: "Item one", annotations: {} }],
				},
			},
		];
		const md = parseNotionBlocksToMarkdown(blocks);
		expect(md).toContain("- Item one");
	});

	it("extracts page title from properties", () => {
		const properties = {
			title: {
				title: [{ plain_text: "My Page" }],
			},
		};
		expect(extractNotionPageTitle(properties)).toBe("My Page");
	});

	it("extracts title from Name property", () => {
		const properties = {
			Name: {
				title: [{ plain_text: "Named Page" }],
			},
		};
		expect(extractNotionPageTitle(properties)).toBe("Named Page");
	});
});
