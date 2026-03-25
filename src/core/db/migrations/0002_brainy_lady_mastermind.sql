CREATE TABLE `experiment_results` (
	`id` text PRIMARY KEY NOT NULL,
	`experiment_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`impressions` integer DEFAULT 0,
	`visits` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`sends` integer DEFAULT 0,
	`replies` integer DEFAULT 0,
	`conversions` integer DEFAULT 0,
	`spend` real DEFAULT 0,
	`conversion_rate` real,
	`reply_rate` real,
	`ctr` real,
	`cpa` real,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `experiment_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `experiment_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`experiment_id` text NOT NULL,
	`variant_key` text NOT NULL,
	`content_ref` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` text PRIMARY KEY NOT NULL,
	`surface` text NOT NULL,
	`hypothesis` text NOT NULL,
	`owner_agent` text NOT NULL,
	`primary_metric` text NOT NULL,
	`min_sample_size` integer,
	`min_send_count` integer,
	`min_spend` real,
	`vertical` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`winner_variant_id` text,
	`started_at` text,
	`ended_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outreach_events` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` integer NOT NULL,
	`contact_id` integer,
	`channel` text NOT NULL,
	`template_id` text,
	`experiment_id` text,
	`variant_id` text,
	`message_hash` text,
	`delivery_status` text,
	`outcome` text,
	`sent_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vertical_performance_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`performance_date` text NOT NULL,
	`vertical` text NOT NULL,
	`accounts_identified` integer DEFAULT 0,
	`outreach_sent` integer DEFAULT 0,
	`replies` integer DEFAULT 0,
	`meetings` integer DEFAULT 0,
	`customers` integer DEFAULT 0,
	`spend` real DEFAULT 0,
	`conversion_rate` real,
	`cpa` real,
	`sample_size` integer DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `primary_vertical` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `source_vertical` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `last_outreach_at` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `qualified_at` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `customer_at` text;--> statement-breakpoint
ALTER TABLE `content` ADD `approved_for_use` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `content` ADD `experiment_id` text;--> statement-breakpoint
ALTER TABLE `content` ADD `content_hash` text;