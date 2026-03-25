CREATE TABLE `agent_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`agent` text NOT NULL,
	`activity_date` text NOT NULL,
	`actions_taken` text NOT NULL,
	`metrics` text,
	`blockers` text,
	`requests_made` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`from_agent` text NOT NULL,
	`to_agent` text NOT NULL,
	`task_type` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text,
	`created_at` text NOT NULL,
	`started_at` text,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `ceo_directives` (
	`id` text PRIMARY KEY NOT NULL,
	`horizon` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`measurable_target` text,
	`current_value` text,
	`target_value` text,
	`owner_agent` text,
	`supporting_agents` text,
	`due_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`parent_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_charter` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`phase` text NOT NULL,
	`charter_data` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`superseded_at` text
);
