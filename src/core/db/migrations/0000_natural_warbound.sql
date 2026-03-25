CREATE TABLE `ab_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`test_id` integer NOT NULL,
	`variant` text NOT NULL,
	`impressions` integer DEFAULT 0,
	`conversions` integer DEFAULT 0,
	`metric_value` real,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`test_id`) REFERENCES `ab_tests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ab_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`layer` text NOT NULL,
	`hypothesis` text,
	`variants` text NOT NULL,
	`metric` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`google_place_id` text,
	`name` text NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`phone` text,
	`website` text,
	`vertical` text,
	`employee_count` text,
	`google_rating` real,
	`review_count` integer,
	`booking_software` text,
	`fit_score` real DEFAULT 0,
	`intent_score` real DEFAULT 0,
	`total_score` real DEFAULT 0,
	`tier` integer,
	`stage` text DEFAULT 'identified',
	`enriched_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_google_place_id_unique` ON `accounts` (`google_place_id`);--> statement-breakpoint
CREATE TABLE `ad_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`platform` text NOT NULL,
	`external_id` text,
	`name` text NOT NULL,
	`targeting` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad_group_id` integer NOT NULL,
	`platform` text NOT NULL,
	`external_id` text,
	`content_id` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`metrics` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`ad_group_id`) REFERENCES `ad_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `analytics_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`metric_type` text NOT NULL,
	`dimensions` text,
	`values` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`pulled_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_quota_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`date` text NOT NULL,
	`calls_made` integer DEFAULT 0 NOT NULL,
	`quota_limit` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attribution_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer,
	`touchpoint_type` text NOT NULL,
	`channel` text NOT NULL,
	`campaign_id` integer,
	`content_id` integer,
	`occurred_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audiences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`external_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer,
	`criteria` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaign_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`content_id` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`external_id` text,
	`name` text NOT NULL,
	`objective` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`budget` real,
	`budget_period` text,
	`vertical` text,
	`stage_target` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`name` text,
	`email` text,
	`phone` text,
	`linkedin_url` text,
	`role` text,
	`is_decision_maker` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`vertical` text,
	`persona` text,
	`stage` text,
	`channel` text,
	`title` text,
	`body` text NOT NULL,
	`file_path` text,
	`generation_prompt` text,
	`external_id` text,
	`approved_at` text,
	`published_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_calendar` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer,
	`channel` text NOT NULL,
	`scheduled_for` text NOT NULL,
	`published_at` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_sends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer,
	`recipient_email` text NOT NULL,
	`sent_at` text,
	`opened_at` text,
	`clicked_at` text,
	`unsubscribed_at` text,
	`bounced_at` text,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_suppressions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`reason` text NOT NULL,
	`suppressed_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_suppressions_email_unique` ON `email_suppressions` (`email`);--> statement-breakpoint
CREATE TABLE `engine_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`level` text NOT NULL,
	`layer` text NOT NULL,
	`code` text NOT NULL,
	`message` text NOT NULL,
	`context` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `generation_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_type` text NOT NULL,
	`prompt_hash` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`duration_ms` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `icp_weights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dimension` text NOT NULL,
	`value` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`source` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `keywords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad_group_id` integer NOT NULL,
	`keyword` text NOT NULL,
	`match_type` text NOT NULL,
	`bid` real,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`ad_group_id`) REFERENCES `ad_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `knowledge_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`subcategory` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`source_path` text,
	`source_type` text NOT NULL,
	`content_hash` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`indexed_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `oauth_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`access_token_enc` text NOT NULL,
	`refresh_token_enc` text,
	`expires_at` text,
	`scopes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer,
	`source` text NOT NULL,
	`source_id` text,
	`signal_type` text NOT NULL,
	`strength` real DEFAULT 1 NOT NULL,
	`raw_data` text,
	`detected_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stage_transitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`from_stage` text NOT NULL,
	`to_stage` text NOT NULL,
	`trigger` text NOT NULL,
	`transitioned_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
