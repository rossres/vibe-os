import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BrainService } from "../brain/service.js";
import { contentHash } from "../brain/hasher.js";
import { ok, err, type Result } from "../core/errors.js";
import type { ContentType, VerticalSlug, PersonaSlug, AwarenessStage, Channel } from "../core/types.js";
import { buildSystemPrompt, buildGenerationPrompt } from "./prompts.js";

export interface GenerationRequest {
	type: ContentType;
	vertical?: VerticalSlug;
	persona?: PersonaSlug;
	stage?: AwarenessStage;
	platform?: Channel;
	context?: Record<string, unknown>;
	variants?: number;
}

export interface GeneratedContent {
	contentType: ContentType;
	variants: Array<{ id: number; content: Record<string, unknown> }>;
	model: string;
	tokensUsed: { input: number; output: number };
	filePath: string;
	generatedAt: string;
}

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_OUTPUT_DIR = "./output";

export class CopywriterService {
	private brain: BrainService;
	private model: string;
	private outputDir: string;
	private client: Anthropic;

	constructor(options: {
		brain: BrainService;
		model?: string;
		outputDir?: string;
	}) {
		this.brain = options.brain;
		this.model = options.model ?? DEFAULT_MODEL;
		this.outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
		this.client = new Anthropic();
	}

	async generate(request: GenerationRequest): Promise<Result<GeneratedContent>> {
		try {
			const systemPrompt = buildSystemPrompt(this.brain);
			const userPrompt = buildGenerationPrompt(this.brain, {
				...request,
				variants: request.variants ?? 3,
			});

			const response = await this.client.messages.create({
				model: this.model,
				max_tokens: 4096,
				system: systemPrompt,
				messages: [{ role: "user", content: userPrompt }],
			});

			const textBlock = response.content.find((b) => b.type === "text");
			if (!textBlock || textBlock.type !== "text") {
				return err({
					code: "COPYWRITER_EMPTY_RESPONSE",
					message: "Claude returned no text content",
					layer: "copywriter",
					retryable: true,
				});
			}

			const parsed = parseJsonResponse(textBlock.text);
			if (!parsed) {
				return err({
					code: "COPYWRITER_PARSE_ERROR",
					message: "Failed to parse JSON from Claude response",
					layer: "copywriter",
					retryable: true,
					context: { rawText: textBlock.text.slice(0, 500) },
				});
			}

			const now = new Date();
			const dateStr = now.toISOString().slice(0, 10);
			const hashInput = JSON.stringify({
				type: request.type,
				vertical: request.vertical,
				persona: request.persona,
				stage: request.stage,
				platform: request.platform,
				generatedAt: now.toISOString(),
			});
			const hash = contentHash(hashInput);

			const parts = [
				request.vertical ?? "general",
				request.persona ?? "all",
				request.stage ?? "any",
				hash,
			];
			const fileName = `${parts.join("-")}.json`;
			const dirPath = join(this.outputDir, request.type, dateStr);
			const filePath = join(dirPath, fileName);

			mkdirSync(dirPath, { recursive: true });

			const result: GeneratedContent = {
				contentType: request.type,
				variants: parsed.variants,
				model: this.model,
				tokensUsed: {
					input: response.usage.input_tokens,
					output: response.usage.output_tokens,
				},
				filePath,
				generatedAt: now.toISOString(),
			};

			writeFileSync(filePath, JSON.stringify(result, null, 2), "utf-8");

			return ok(result);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown error during generation";
			return err({
				code: "COPYWRITER_GENERATION_ERROR",
				message,
				layer: "copywriter",
				retryable: true,
				context: { type: request.type },
			});
		}
	}

	async revise(
		previousOutput: GeneratedContent,
		feedback: string,
	): Promise<Result<GeneratedContent>> {
		try {
			const systemPrompt = buildSystemPrompt(this.brain);

			const response = await this.client.messages.create({
				model: this.model,
				max_tokens: 4096,
				system: systemPrompt,
				messages: [
					{
						role: "user",
						content: `Here is the previously generated content:\n\n${JSON.stringify(previousOutput.variants, null, 2)}`,
					},
					{
						role: "assistant",
						content: "I've reviewed the previous content. What changes would you like?",
					},
					{
						role: "user",
						content: `Please revise the content based on this feedback:\n\n${feedback}\n\nReturn the revised content as JSON: { "variants": [{ "id": 1, "content": { ... } }] }`,
					},
				],
			});

			const textBlock = response.content.find((b) => b.type === "text");
			if (!textBlock || textBlock.type !== "text") {
				return err({
					code: "COPYWRITER_EMPTY_RESPONSE",
					message: "Claude returned no text content on revision",
					layer: "copywriter",
					retryable: true,
				});
			}

			const parsed = parseJsonResponse(textBlock.text);
			if (!parsed) {
				return err({
					code: "COPYWRITER_PARSE_ERROR",
					message: "Failed to parse JSON from Claude revision response",
					layer: "copywriter",
					retryable: true,
					context: { rawText: textBlock.text.slice(0, 500) },
				});
			}

			const now = new Date();
			const dateStr = now.toISOString().slice(0, 10);
			const hash = contentHash(
				JSON.stringify({ previous: previousOutput.filePath, feedback, at: now.toISOString() }),
			);
			const fileName = `revised-${hash}.json`;
			const dirPath = join(
				this.outputDir,
				previousOutput.contentType,
				dateStr,
			);
			const filePath = join(dirPath, fileName);

			mkdirSync(dirPath, { recursive: true });

			const result: GeneratedContent = {
				contentType: previousOutput.contentType,
				variants: parsed.variants,
				model: this.model,
				tokensUsed: {
					input: response.usage.input_tokens,
					output: response.usage.output_tokens,
				},
				filePath,
				generatedAt: now.toISOString(),
			};

			writeFileSync(filePath, JSON.stringify(result, null, 2), "utf-8");

			return ok(result);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown error during revision";
			return err({
				code: "COPYWRITER_REVISION_ERROR",
				message,
				layer: "copywriter",
				retryable: true,
				context: { feedback },
			});
		}
	}
}

function parseJsonResponse(
	text: string,
): { variants: Array<{ id: number; content: Record<string, unknown> }> } | null {
	// Try direct parse first
	try {
		const parsed = JSON.parse(text);
		if (parsed.variants && Array.isArray(parsed.variants)) {
			return parsed;
		}
	} catch {
		// Fall through to extraction
	}

	// Try extracting JSON from markdown code blocks
	const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
	if (codeBlockMatch) {
		try {
			const parsed = JSON.parse(codeBlockMatch[1]);
			if (parsed.variants && Array.isArray(parsed.variants)) {
				return parsed;
			}
		} catch {
			// Fall through
		}
	}

	// Try finding JSON object in the text
	const jsonMatch = text.match(/\{[\s\S]*"variants"[\s\S]*\}/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0]);
			if (parsed.variants && Array.isArray(parsed.variants)) {
				return parsed;
			}
		} catch {
			// Give up
		}
	}

	return null;
}
