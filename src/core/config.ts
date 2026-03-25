import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
import { z } from "zod";

const BrandVoiceSchema = z.object({
	tone: z.string(),
	warmth: z.string(),
	directness: z.string(),
	vocabulary: z.object({
		prefer: z.array(z.string()),
		avoid: z.array(z.string()),
	}),
	style: z.string(),
});

const Narrative FrameworkSchema = z.object({
	hero: z.string(),
	what_they_want: z.array(z.string()),
	desire: z.string(),
	problem: z.object({
		external: z.array(z.string()),
		internal: z.string(),
		internal_emotions: z.array(z.string()),
		philosophical: z.string(),
	}),
	guide: z.object({
		empathy: z.string(),
		authority: z.string(),
	}),
	plan: z.object({
		step_1: z.string(),
		step_2: z.string(),
		step_3: z.string(),
	}),
	failure: z.array(z.string()),
	success: z.object({
		outcomes: z.array(z.string()),
		life_benefits: z.array(z.string()),
	}),
	one_liner: z.string(),
	core_idea: z.string(),
	cta: z.object({
		primary: z.string(),
		secondary: z.string(),
	}),
}).optional();

const CanonicalSchema = z.object({
	hero: z.string(),
	promise: z.string(),
	category: z.string(),
	mechanism: z.array(z.string()),
	emotional_frame: z.object({
		internal_problem: z.string(),
		philosophical_problem: z.string(),
		heart_plus_wallet: z.string(),
	}),
}).optional();

const GovernanceSchema = z.object({
	rules: z.array(z.string()),
	validation_checklist: z.array(z.string()),
}).optional();

const RankedFeatureSchema = z.object({
	feature: z.string(),
	why: z.string(),
});

const VerticalSchema = z.object({
	display_name: z.string(),
	tier: z.enum(["a", "b", "c"]).optional(),
	pain_points: z.array(z.string()),
	demo_hook: z.string(),
	revenue_per_missed_interaction: z.string(),
	key_features: z.array(z.string()),
	ranked_features: z.array(RankedFeatureSchema).default([]),
	language: z.record(z.string(), z.string()).default({}),
	tone: z.enum(["professional", "standard"]).default("standard"),
});

const PersonaSchema = z.object({
	description: z.string(),
	role: z.enum(["primary", "secondary", "influencer"]).optional(),
	employee_range: z.string(),
	revenue_range: z.string(),
	pain_points: z.array(z.string()),
	communication_style: z.string(),
	decision_factors: z.array(z.string()),
});

const PricingTierSchema = z.object({
	name: z.string(),
	price: z.string(),
	included_units: z.number().optional(),
	overage_rate: z.string().optional(),
	features: z.array(z.string()),
});

const PricingSchema = z.object({
	tiers: z.array(PricingTierSchema),
	roi_framing: z.string(),
	per_unit_cost: z.string(),
	per_missed_interaction_loss: z.string(),
	competitor_comparison: z.string(),
}).optional();

const CompetitiveSchema = z.object({
	only_we_statements: z.array(z.string()),
	key_differentiators: z.array(z.string()),
	comparison_table: z.record(z.string(), z.record(z.string(), z.string())).default({}),
}).optional();

const StageMsgSchema = z.object({
	headline: z.string(),
	cta: z.string(),
});

const StageMessagingSchema = z.object({
	identified: StageMsgSchema,
	aware: StageMsgSchema,
	interested: StageMsgSchema,
	consider: StageMsgSchema,
	selecting: StageMsgSchema,
}).optional();

const ProjectSchema = z.object({
	name: z.string(),
	tagline: z.string().default(""),
	category: z.string().default(""),
	website: z.string().default(""),
}).optional();

const BrandConfigSchema = z.object({
	project: ProjectSchema,
	voice: BrandVoiceSchema,
	narrative: Narrative FrameworkSchema,
	canonical: CanonicalSchema,
	governance: GovernanceSchema,
	verticals: z.object({
		tier_a: z.array(z.string()),
		tier_b: z.array(z.string()),
		tier_c: z.array(z.string()),
	}),
	personas: z.object({
		primary: z.string(),
		secondary: z.string(),
		influencer: z.string(),
	}),
	pricing: PricingSchema,
	competitive: CompetitiveSchema,
	stage_messaging: StageMessagingSchema,
	compliance: z.object({
		physical_address: z.string(),
		unsubscribe_url: z.string(),
		data_retention_days: z.number(),
	}),
});

// Vertical data can live in a separate file or inline in brand.yaml
const VerticalDataFileSchema = z.record(z.string(), VerticalSchema);
const PersonaDataFileSchema = z.record(z.string(), PersonaSchema);

const PlatformConfigSchema = z.object({
	posthog: z.object({ api_key: z.string(), host: z.string() }),
	ga4: z.object({ property_id: z.string(), service_account_key_path: z.string() }),
	gsc: z.object({ service_account_key_path: z.string() }),
	google_ads: z.object({ customer_id: z.string(), developer_token: z.string() }),
	meta: z.object({ app_id: z.string(), app_secret: z.string() }),
	linkedin: z.object({ client_id: z.string(), client_secret: z.string() }),
	resend: z.object({ api_key: z.string() }),
	google_places: z.object({ api_key: z.string() }),
	notion: z.object({
		api_key: z.string(),
		databases: z.object({ cold_outreach: z.string(), partners: z.string() }),
	}),
});

export type BrandConfig = z.infer<typeof BrandConfigSchema>;
export type VerticalConfig = z.infer<typeof VerticalSchema>;
export type PersonaConfig = z.infer<typeof PersonaSchema>;
export type PricingConfig = NonNullable<z.infer<typeof PricingSchema>>;
export type CompetitiveConfig = NonNullable<z.infer<typeof CompetitiveSchema>>;
export type StageMessagingConfig = NonNullable<z.infer<typeof StageMessagingSchema>>;
export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

export function loadBrandConfig(path: string): BrandConfig {
	const raw = readFileSync(path, "utf-8");
	const parsed = parse(raw);
	return BrandConfigSchema.parse(parsed);
}

/**
 * Load vertical definitions from a separate YAML file.
 * Returns a record of slug → vertical config.
 */
export function loadVerticalData(path: string): Record<string, VerticalConfig> {
	if (!existsSync(path)) return {};
	const raw = readFileSync(path, "utf-8");
	const parsed = parse(raw);
	return VerticalDataFileSchema.parse(parsed);
}

/**
 * Load persona definitions from a separate YAML file.
 * Returns a record of slug → persona config.
 */
export function loadPersonaData(path: string): Record<string, PersonaConfig> {
	if (!existsSync(path)) return {};
	const raw = readFileSync(path, "utf-8");
	const parsed = parse(raw);
	return PersonaDataFileSchema.parse(parsed);
}

export function loadPlatformConfig(path: string): PlatformConfig {
	const raw = readFileSync(path, "utf-8");
	const parsed = parse(raw);
	return PlatformConfigSchema.parse(parsed);
}
