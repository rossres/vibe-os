import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// System tables
export const oauthTokens = sqliteTable("oauth_tokens", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	platform: text("platform").notNull(),
	accessTokenEnc: text("access_token_enc").notNull(),
	refreshTokenEnc: text("refresh_token_enc"),
	expiresAt: text("expires_at"),
	scopes: text("scopes"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
	updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const apiQuotaUsage = sqliteTable("api_quota_usage", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	platform: text("platform").notNull(),
	date: text("date").notNull(),
	callsMade: integer("calls_made").default(0).notNull(),
	quotaLimit: integer("quota_limit").notNull(),
});

export const engineLog = sqliteTable("engine_log", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	level: text("level").notNull(),
	layer: text("layer").notNull(),
	code: text("code").notNull(),
	message: text("message").notNull(),
	context: text("context"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// Knowledge / Brain tables
export const knowledgeEntries = sqliteTable("knowledge_entries", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	category: text("category").notNull(),
	subcategory: text("subcategory"),
	title: text("title").notNull(),
	body: text("body").notNull(),
	sourcePath: text("source_path"),
	sourceType: text("source_type").notNull(),
	contentHash: text("content_hash").notNull(),
	version: integer("version").default(1).notNull(),
	indexedAt: text("indexed_at").default(sql`(datetime('now'))`).notNull(),
	updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const icpWeights = sqliteTable("icp_weights", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	dimension: text("dimension").notNull(),
	value: text("value").notNull(),
	weight: real("weight").default(1.0).notNull(),
	source: text("source").notNull(),
	updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// Accounts & Contacts
export const accounts = sqliteTable("accounts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	googlePlaceId: text("google_place_id").unique(),
	name: text("name").notNull(),
	address: text("address"),
	city: text("city"),
	state: text("state"),
	phone: text("phone"),
	website: text("website"),
	vertical: text("vertical"),
	employeeCount: text("employee_count"),
	googleRating: real("google_rating"),
	reviewCount: integer("review_count"),
	bookingSoftware: text("booking_software"),
	fitScore: real("fit_score").default(0),
	intentScore: real("intent_score").default(0),
	totalScore: real("total_score").default(0),
	tier: integer("tier"),
	stage: text("stage").default("identified"),
	enrichedAt: text("enriched_at"),
	primaryVertical: text("primary_vertical"),
	sourceVertical: text("source_vertical"),
	lastOutreachAt: text("last_outreach_at"),
	qualifiedAt: text("qualified_at"),
	customerAt: text("customer_at"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
	updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const contacts = sqliteTable("contacts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	accountId: integer("account_id")
		.references(() => accounts.id)
		.notNull(),
	name: text("name"),
	email: text("email"),
	phone: text("phone"),
	linkedinUrl: text("linkedin_url"),
	role: text("role"),
	isDecisionMaker: integer("is_decision_maker", { mode: "boolean" }).default(false),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const signals = sqliteTable("signals", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	accountId: integer("account_id").references(() => accounts.id),
	source: text("source").notNull(),
	sourceId: text("source_id"),
	signalType: text("signal_type").notNull(),
	strength: real("strength").default(1.0).notNull(),
	rawData: text("raw_data"),
	detectedAt: text("detected_at").default(sql`(datetime('now'))`).notNull(),
});

export const stageTransitions = sqliteTable("stage_transitions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	accountId: integer("account_id")
		.references(() => accounts.id)
		.notNull(),
	fromStage: text("from_stage").notNull(),
	toStage: text("to_stage").notNull(),
	trigger: text("trigger").notNull(),
	transitionedAt: text("transitioned_at").default(sql`(datetime('now'))`).notNull(),
});

// Content & Creative
export const content = sqliteTable("content", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	type: text("type").notNull(),
	status: text("status").default("draft").notNull(),
	vertical: text("vertical"),
	persona: text("persona"),
	stage: text("stage"),
	channel: text("channel"),
	title: text("title"),
	body: text("body").notNull(),
	filePath: text("file_path"),
	generationPrompt: text("generation_prompt"),
	externalId: text("external_id"),
	approvedAt: text("approved_at"),
	publishedAt: text("published_at"),
	approvedForUse: integer("approved_for_use").default(0),
	experimentId: text("experiment_id"),
	contentHash: text("content_hash"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
	updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const generationLog = sqliteTable("generation_log", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	contentType: text("content_type").notNull(),
	promptHash: text("prompt_hash").notNull(),
	model: text("model").notNull(),
	inputTokens: integer("input_tokens"),
	outputTokens: integer("output_tokens"),
	durationMs: integer("duration_ms"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// Campaigns
export const campaigns = sqliteTable("campaigns", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	platform: text("platform").notNull(),
	externalId: text("external_id"),
	name: text("name").notNull(),
	objective: text("objective"),
	status: text("status").default("draft").notNull(),
	budget: real("budget"),
	budgetPeriod: text("budget_period"),
	vertical: text("vertical"),
	stageTarget: text("stage_target"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
	updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const adGroups = sqliteTable("ad_groups", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	campaignId: integer("campaign_id")
		.references(() => campaigns.id)
		.notNull(),
	platform: text("platform").notNull(),
	externalId: text("external_id"),
	name: text("name").notNull(),
	targeting: text("targeting"),
	status: text("status").default("active").notNull(),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const ads = sqliteTable("ads", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	adGroupId: integer("ad_group_id")
		.references(() => adGroups.id)
		.notNull(),
	platform: text("platform").notNull(),
	externalId: text("external_id"),
	contentId: integer("content_id").references(() => content.id),
	status: text("status").default("active").notNull(),
	metrics: text("metrics"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const keywords = sqliteTable("keywords", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	adGroupId: integer("ad_group_id")
		.references(() => adGroups.id)
		.notNull(),
	keyword: text("keyword").notNull(),
	matchType: text("match_type").notNull(),
	bid: real("bid"),
	status: text("status").default("active").notNull(),
});

export const audiences = sqliteTable("audiences", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	platform: text("platform").notNull(),
	externalId: text("external_id"),
	name: text("name").notNull(),
	type: text("type").notNull(),
	size: integer("size"),
	criteria: text("criteria"),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const campaignContent = sqliteTable("campaign_content", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	campaignId: integer("campaign_id")
		.references(() => campaigns.id)
		.notNull(),
	contentId: integer("content_id")
		.references(() => content.id)
		.notNull(),
});

// Email & Compliance
export const emailSends = sqliteTable("email_sends", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	contentId: integer("content_id").references(() => content.id),
	recipientEmail: text("recipient_email").notNull(),
	sentAt: text("sent_at"),
	openedAt: text("opened_at"),
	clickedAt: text("clicked_at"),
	unsubscribedAt: text("unsubscribed_at"),
	bouncedAt: text("bounced_at"),
});

export const emailSuppressions = sqliteTable("email_suppressions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	email: text("email").notNull().unique(),
	reason: text("reason").notNull(),
	suppressedAt: text("suppressed_at").default(sql`(datetime('now'))`).notNull(),
});

// Analytics
export const analyticsSnapshots = sqliteTable("analytics_snapshots", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	source: text("source").notNull(),
	metricType: text("metric_type").notNull(),
	dimensions: text("dimensions"),
	values: text("values").notNull(),
	periodStart: text("period_start").notNull(),
	periodEnd: text("period_end").notNull(),
	pulledAt: text("pulled_at").default(sql`(datetime('now'))`).notNull(),
});

export const attributionEvents = sqliteTable("attribution_events", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	accountId: integer("account_id").references(() => accounts.id),
	touchpointType: text("touchpoint_type").notNull(),
	channel: text("channel").notNull(),
	campaignId: integer("campaign_id").references(() => campaigns.id),
	contentId: integer("content_id").references(() => content.id),
	occurredAt: text("occurred_at").default(sql`(datetime('now'))`).notNull(),
});

// A/B Testing
export const abTests = sqliteTable("ab_tests", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	layer: text("layer").notNull(),
	hypothesis: text("hypothesis"),
	variants: text("variants").notNull(),
	metric: text("metric").notNull(),
	startDate: text("start_date"),
	endDate: text("end_date"),
	status: text("status").default("draft").notNull(),
	createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const abResults = sqliteTable("ab_results", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	testId: integer("test_id")
		.references(() => abTests.id)
		.notNull(),
	variant: text("variant").notNull(),
	impressions: integer("impressions").default(0),
	conversions: integer("conversions").default(0),
	metricValue: real("metric_value"),
	updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// Content Calendar
export const contentCalendar = sqliteTable("content_calendar", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	contentId: integer("content_id").references(() => content.id),
	channel: text("channel").notNull(),
	scheduledFor: text("scheduled_for").notNull(),
	publishedAt: text("published_at"),
	status: text("status").default("scheduled").notNull(),
});

// Marketing Engine — Agent Infrastructure
export const systemCharter = sqliteTable("system_charter", {
	id: text("id").primaryKey(),
	version: integer("version").notNull(),
	phase: text("phase").notNull(),
	charterData: text("charter_data").notNull(),
	isActive: integer("is_active").notNull().default(1),
	createdBy: text("created_by").notNull(),
	createdAt: text("created_at").notNull(),
	supersededAt: text("superseded_at"),
});

export const ceoDirectives = sqliteTable("ceo_directives", {
	id: text("id").primaryKey(),
	horizon: text("horizon").notNull(),
	title: text("title").notNull(),
	description: text("description"),
	measurableTarget: text("measurable_target"),
	currentValue: text("current_value"),
	targetValue: text("target_value"),
	ownerAgent: text("owner_agent"),
	supportingAgents: text("supporting_agents"),
	dueDate: text("due_date"),
	status: text("status").notNull().default("active"),
	parentId: text("parent_id"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const agentTasks = sqliteTable("agent_tasks", {
	id: text("id").primaryKey(),
	fromAgent: text("from_agent").notNull(),
	toAgent: text("to_agent").notNull(),
	taskType: text("task_type").notNull(),
	priority: text("priority").notNull().default("normal"),
	payload: text("payload").notNull(),
	status: text("status").notNull().default("pending"),
	result: text("result"),
	createdAt: text("created_at").notNull(),
	startedAt: text("started_at"),
	completedAt: text("completed_at"),
});

export const agentActivity = sqliteTable("agent_activity", {
	id: text("id").primaryKey(),
	agent: text("agent").notNull(),
	activityDate: text("activity_date").notNull(),
	actionsTaken: text("actions_taken").notNull(),
	metrics: text("metrics"),
	blockers: text("blockers"),
	requestsMade: text("requests_made"),
	createdAt: text("created_at").notNull(),
});

// Marketing Engine — Experiments
export const experiments = sqliteTable("experiments", {
	id: text("id").primaryKey(),
	surface: text("surface").notNull(),
	hypothesis: text("hypothesis").notNull(),
	ownerAgent: text("owner_agent").notNull(),
	primaryMetric: text("primary_metric").notNull(),
	minSampleSize: integer("min_sample_size"),
	minSendCount: integer("min_send_count"),
	minSpend: real("min_spend"),
	vertical: text("vertical").notNull(),
	status: text("status").notNull().default("draft"),
	winnerVariantId: text("winner_variant_id"),
	startedAt: text("started_at"),
	endedAt: text("ended_at"),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const experimentVariants = sqliteTable("experiment_variants", {
	id: text("id").primaryKey(),
	experimentId: text("experiment_id")
		.notNull()
		.references(() => experiments.id),
	variantKey: text("variant_key").notNull(),
	contentRef: text("content_ref"),
	metadata: text("metadata"),
	createdAt: text("created_at").notNull(),
});

export const experimentResults = sqliteTable("experiment_results", {
	id: text("id").primaryKey(),
	experimentId: text("experiment_id")
		.notNull()
		.references(() => experiments.id),
	variantId: text("variant_id")
		.notNull()
		.references(() => experimentVariants.id),
	impressions: integer("impressions").default(0),
	visits: integer("visits").default(0),
	clicks: integer("clicks").default(0),
	sends: integer("sends").default(0),
	replies: integer("replies").default(0),
	conversions: integer("conversions").default(0),
	spend: real("spend").default(0),
	conversionRate: real("conversion_rate"),
	replyRate: real("reply_rate"),
	ctr: real("ctr"),
	cpa: real("cpa"),
	updatedAt: text("updated_at").notNull(),
});

// Marketing Engine — Operational
export const verticalPerformanceDaily = sqliteTable("vertical_performance_daily", {
	id: text("id").primaryKey(),
	performanceDate: text("performance_date").notNull(),
	vertical: text("vertical").notNull(),
	accountsIdentified: integer("accounts_identified").default(0),
	outreachSent: integer("outreach_sent").default(0),
	replies: integer("replies").default(0),
	meetings: integer("meetings").default(0),
	customers: integer("customers").default(0),
	spend: real("spend").default(0),
	conversionRate: real("conversion_rate"),
	cpa: real("cpa"),
	sampleSize: integer("sample_size").default(0),
	createdAt: text("created_at").notNull(),
});

export const outreachEvents = sqliteTable("outreach_events", {
	id: text("id").primaryKey(),
	accountId: integer("account_id").notNull(),
	contactId: integer("contact_id"),
	channel: text("channel").notNull(),
	templateId: text("template_id"),
	experimentId: text("experiment_id"),
	variantId: text("variant_id"),
	messageHash: text("message_hash"),
	deliveryStatus: text("delivery_status"),
	outcome: text("outcome"),
	sentAt: text("sent_at").notNull(),
});
