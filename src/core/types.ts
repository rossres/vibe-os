export type AwarenessStage = "identified" | "aware" | "interested" | "consider" | "selecting";

export type PipelineStage =
	| "identified"
	| "aware"
	| "interested"
	| "consider"
	| "selecting"
	| "customer"
	| "churned"
	| "paused";

export type PhaseName = "phase_0_setup" | "phase_1_prove_vertical";

export type ExperimentSurface = "landing_page" | "email_subject" | "email_body" | "sms" | "cta";

export type ExperimentStatus = "draft" | "running" | "won" | "lost" | "killed" | "archived";

export type AgentId =
	| "setup-agent"
	| "ai-coo-lite"
	| "revops"
	| "ai-sdr"
	| "content-director"
	| "creative-director"
	| "growth-lead"
	| "cpo";

/** Vertical slug — defined in config/brand.yaml, not hardcoded */
export type VerticalSlug = string;

/** Persona slug — defined in config/brand.yaml, not hardcoded */
export type PersonaSlug = string;

export type Platform =
	| "google_ads"
	| "meta"
	| "linkedin"
	| "posthog"
	| "ga4"
	| "gsc"
	| "resend"
	| "google_places"
	| "google_my_business"
	| "notion"
	| "anthropic";

export type ContentStatus = "draft" | "review" | "approved" | "published" | "archived";

export type ContentType =
	| "cold_email"
	| "ad_copy"
	| "social_post"
	| "blog_post"
	| "landing_page"
	| "email_sequence"
	| "sms"
	| "call_script"
	| "voicemail_drop"
	| "onboarding_email"
	| "review_request"
	| "battle_card";

export type Channel =
	| "google_ads"
	| "meta_ads"
	| "linkedin_ads"
	| "blog"
	| "linkedin_organic"
	| "instagram"
	| "email"
	| "sms";

export type KnowledgeCategory =
	| "brand_voice"
	| "messaging"
	| "vertical"
	| "pricing"
	| "competitive"
	| "persona"
	| "icp"
	| "playbook"
	| "template"
	| "sop";

export type SignalSource =
	| "google_reviews"
	| "yelp"
	| "job_board"
	| "posthog"
	| "google_news"
	| "google_places"
	| "email_engagement"
	| "demo_call"
	| "manual";

export type SignalType =
	| "missed_call_review"
	| "receptionist_job"
	| "new_business"
	| "new_location"
	| "site_visit"
	| "demo_call"
	| "email_open"
	| "email_click"
	| "email_reply"
	| "pricing_page_view"
	| "negative_phone_review"
	| "voicemail_full";

export interface DateRange {
	start: Date;
	end: Date;
}

export type { SystemCharter } from "./types/marketing-engine";
