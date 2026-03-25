import {
	loadBrandConfig,
	loadVerticalData,
	loadPersonaData,
	type BrandConfig,
	type VerticalConfig,
	type PersonaConfig,
} from "../core/config.js";
import type { AwarenessStage, PersonaSlug, VerticalSlug } from "../core/types.js";
import { ingestDirectory } from "./ingest.js";
import { ingestNotionDatabase } from "./notion.js";
import { ok, err, type Result } from "../core/errors.js";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export interface BrandVoice {
	tone: string;
	warmth: string;
	directness: string;
	style: string;
	vocabulary: { prefer: string[]; avoid: string[] };
}

export interface VerticalTemplate {
	slug: VerticalSlug;
	tier: "a" | "b" | "c";
	displayName: string;
	painPoints: string[];
	demoHook: string;
	revenuePerMissedInteraction: string;
	keyFeatures: string[];
	rankedFeatures: Array<{ feature: string; why: string }>;
	language: Record<string, string>;
	tone: "professional" | "standard";
}

export interface PricingModel {
	tiers: Array<{
		name: string;
		price: string;
		includedUnits: number;
		overageRate: string;
		features: string[];
	}>;
	roiFraming: string;
	perUnitCost: string;
	perMissedInteractionLoss: string;
	competitorComparison: string;
}

export interface Persona {
	name: PersonaSlug;
	description: string;
	employeeRange: string;
	revenueRange: string;
	topPainPoints: string[];
	communicationStyle: string;
	decisionFactors: string[];
}

export interface MessagingFramework {
	painPoints: string[];
	internalProblem: string;
	philosophicalProblem: string;
	valueProps: string[];
	failureState: string[];
	successState: { wallet: string[]; heart: string[] };
	objectionHandling: Record<string, string>;
	sampleHeadlines: string[];
	callToAction: string;
}

export interface CompetitivePositioning {
	onlyWeStatements: string[];
	comparisonTable: Record<string, Record<string, string>>;
	keyDifferentiators: string[];
}

export class BrainService {
	private config: BrandConfig;
	private verticalData: Record<string, VerticalConfig>;
	private personaData: Record<string, PersonaConfig>;

	constructor(options: {
		brandConfigPath: string;
		verticalsPath?: string;
		personasPath?: string;
	}) {
		this.config = loadBrandConfig(options.brandConfigPath);

		// Load vertical data from separate file, or empty if not provided
		const configDir = dirname(options.brandConfigPath);
		const verticalsPath = options.verticalsPath ?? join(configDir, "verticals.yaml");
		const personasPath = options.personasPath ?? join(configDir, "personas.yaml");

		this.verticalData = loadVerticalData(verticalsPath);
		this.personaData = loadPersonaData(personasPath);
	}

	getProjectName(): string {
		return this.config.project?.name ?? "Vibe OS";
	}

	getBrandVoice(): BrandVoice {
		return {
			tone: this.config.voice.tone,
			warmth: this.config.voice.warmth,
			directness: this.config.voice.directness,
			style: this.config.voice.style,
			vocabulary: {
				prefer: [...this.config.voice.vocabulary.prefer],
				avoid: [...this.config.voice.vocabulary.avoid],
			},
		};
	}

	getNarrative Framework() {
		return this.config.narrative ?? null;
	}

	getVerticalTemplate(vertical: VerticalSlug): VerticalTemplate {
		const data = this.verticalData[vertical];
		if (!data) {
			return {
				slug: vertical,
				tier: "c",
				displayName: vertical,
				painPoints: [],
				demoHook: "",
				revenuePerMissedInteraction: "",
				keyFeatures: [],
				rankedFeatures: [],
				language: { customer: "customer", business: "business", appointment: "appointment" },
				tone: "standard" as const,
			};
		}

		// Determine tier from config or vertical data
		let tier: "a" | "b" | "c" = data.tier ?? "c";
		if (this.config.verticals.tier_a.includes(vertical)) tier = "a";
		else if (this.config.verticals.tier_b.includes(vertical)) tier = "b";

		return {
			slug: vertical,
			tier,
			displayName: data.display_name,
			painPoints: [...data.pain_points],
			demoHook: data.demo_hook,
			revenuePerMissedInteraction: data.revenue_per_missed_interaction,
			keyFeatures: [...data.key_features],
			rankedFeatures: (data.ranked_features ?? []).map((f) => ({ ...f })),
			language: { ...data.language },
			tone: data.tone ?? "standard",
		};
	}

	/** Get all configured vertical slugs across all tiers */
	getAllVerticals(): VerticalSlug[] {
		return [
			...this.config.verticals.tier_a,
			...this.config.verticals.tier_b,
			...this.config.verticals.tier_c,
		];
	}

	/** Get all configured persona slugs */
	getAllPersonas(): PersonaSlug[] {
		return [
			this.config.personas.primary,
			this.config.personas.secondary,
			this.config.personas.influencer,
		].filter(Boolean);
	}

	getPricing(): PricingModel | null {
		const pricing = this.config.pricing;
		if (!pricing) return null;

		return {
			tiers: pricing.tiers.map((t) => ({
				name: t.name,
				price: t.price,
				includedUnits: t.included_units ?? 0,
				overageRate: t.overage_rate ?? "",
				features: [...t.features],
			})),
			roiFraming: pricing.roi_framing,
			perUnitCost: pricing.per_unit_cost,
			perMissedInteractionLoss: pricing.per_missed_interaction_loss,
			competitorComparison: pricing.competitor_comparison,
		};
	}

	getPersona(slug: PersonaSlug): Persona {
		const data = this.personaData[slug];
		if (!data) {
			return {
				name: slug,
				description: "",
				employeeRange: "",
				revenueRange: "",
				topPainPoints: [],
				communicationStyle: "",
				decisionFactors: [],
			};
		}

		return {
			name: slug,
			description: data.description,
			employeeRange: data.employee_range,
			revenueRange: data.revenue_range,
			topPainPoints: [...data.pain_points],
			communicationStyle: data.communication_style,
			decisionFactors: [...data.decision_factors],
		};
	}

	getMessaging(
		vertical: VerticalSlug,
		persona: PersonaSlug,
		stage: AwarenessStage,
	): MessagingFramework {
		const verticalTemplate = this.getVerticalTemplate(vertical);
		const personaData = this.getPersona(persona);
		const stageConfig = this.config.stage_messaging?.[stage];
		const narrative = this.config.narrative;
		const canonical = this.config.canonical;

		const headlineTemplate = stageConfig?.headline ?? "";
		const ctaTemplate = stageConfig?.cta ?? "";

		const headline = headlineTemplate
			.replace("{revenue}", verticalTemplate.revenuePerMissedInteraction)
			.replace("{vertical}", verticalTemplate.displayName);

		const cta = ctaTemplate.replace("{vertical}", verticalTemplate.displayName);

		const internalProblem =
			canonical?.emotional_frame.internal_problem ??
			narrative?.problem.internal ??
			"";
		const philosophicalProblem =
			canonical?.emotional_frame.philosophical_problem ??
			narrative?.problem.philosophical ??
			"";

		return {
			painPoints: [
				...verticalTemplate.painPoints,
				...personaData.topPainPoints.slice(0, 2),
			],
			internalProblem,
			philosophicalProblem,
			valueProps: narrative
				? [
						`Every ${(canonical?.mechanism ?? []).join(" and ")} answered for your ${verticalTemplate.displayName}`,
						`No missed customers — by ${(canonical?.mechanism ?? []).join(" or ")}`,
						narrative.core_idea,
						"Set up in minutes",
					]
				: [],
			failureState: narrative?.failure ?? [],
			successState: {
				wallet: narrative?.success.outcomes ?? [],
				heart: narrative?.success.life_benefits ?? [],
			},
			objectionHandling: {},
			sampleHeadlines: headline ? [headline] : [],
			callToAction: cta,
		};
	}

	getCompetitivePositioning(): CompetitivePositioning {
		const competitive = this.config.competitive;
		if (!competitive) {
			return {
				onlyWeStatements: [],
				comparisonTable: {},
				keyDifferentiators: [],
			};
		}

		return {
			onlyWeStatements: [...competitive.only_we_statements],
			comparisonTable: { ...competitive.comparison_table },
			keyDifferentiators: [...competitive.key_differentiators],
		};
	}

	/**
	 * Returns the canonical narrative — the immovable things every page inherits.
	 */
	getCanonical(): {
		hero: string;
		promise: string;
		category: string;
		mechanism: string[];
		emotionalFrame: {
			internalProblem: string;
			philosophicalProblem: string;
			heartPlusWallet: string;
		};
	} {
		const canonical = this.config.canonical;
		if (!canonical) {
			return {
				hero: this.config.narrative?.hero ?? "",
				promise: this.config.narrative?.one_liner ?? "",
				category: this.config.project?.category ?? "",
				mechanism: [],
				emotionalFrame: {
					internalProblem: this.config.narrative?.problem.internal ?? "",
					philosophicalProblem: this.config.narrative?.problem.philosophical ?? "",
					heartPlusWallet: "Every page must pair a revenue benefit with a life benefit.",
				},
			};
		}

		return {
			hero: canonical.hero,
			promise: canonical.promise,
			category: canonical.category,
			mechanism: [...canonical.mechanism],
			emotionalFrame: {
				internalProblem: canonical.emotional_frame.internal_problem,
				philosophicalProblem: canonical.emotional_frame.philosophical_problem,
				heartPlusWallet: canonical.emotional_frame.heart_plus_wallet,
			},
		};
	}

	/**
	 * Governance validation — checks content against configured rules.
	 * Returns list of failures. Empty array = passes.
	 */
	validateContent(content: string): string[] {
		const failures: string[] = [];
		const lower = content.toLowerCase();

		// Check banned vocabulary
		const banned = this.config.voice.vocabulary.avoid;
		for (const term of banned) {
			if (lower.includes(term.toLowerCase())) {
				failures.push(`vocabulary_violation: Content uses banned term "${term}".`);
			}
		}

		// Check core mechanism is mentioned (if configured)
		const mechanism = this.config.canonical?.mechanism ?? [];
		if (mechanism.length > 0) {
			const allPresent = mechanism.every((m) => lower.includes(m.toLowerCase()));
			if (!allPresent) {
				failures.push(
					`mechanism_missing: Content should mention ${mechanism.join(" and ")}.`,
				);
			}
		}

		return failures;
	}

	async ingestFromSourceDocs(
		path: string,
		subDirs: string[] = ["docs"],
	): Promise<Result<{ filesProcessed: number; errors: string[] }>> {
		let totalFiles = 0;
		const allErrors: string[] = [];

		for (const sub of subDirs) {
			const dirPath = join(path, sub);
			if (!existsSync(dirPath)) continue;

			const result = await ingestDirectory(dirPath);
			if (result.ok) {
				totalFiles += result.data.filesProcessed;
				allErrors.push(...result.data.errors);
			} else {
				allErrors.push(result.error.message);
			}
		}

		if (totalFiles === 0 && allErrors.length > 0) {
			return err({
				code: "SOURCE_INGEST_ERROR",
				message: `No files processed. Errors: ${allErrors.join("; ")}`,
				layer: "brain",
				retryable: false,
			});
		}

		return ok({ filesProcessed: totalFiles, errors: allErrors });
	}

	async ingestFromNotion(
		databaseId: string,
	): Promise<Result<{ pagesProcessed: number; errors: string[] }>> {
		const result = await ingestNotionDatabase(databaseId);
		if (!result.ok) return result as Result<never>;
		return ok({
			pagesProcessed: result.data.pagesProcessed,
			errors: result.data.errors,
		});
	}
}
