CREATE TABLE `finance_billing_plan_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_plan_id` text NOT NULL,
	`participant_count` integer NOT NULL,
	`rate_cents_per_minute` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`billing_plan_id`) REFERENCES `finance_billing_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_plan_rate_participant_count` ON `finance_billing_plan_rates` (`billing_plan_id`,`participant_count`);--> statement-breakpoint
ALTER TABLE `financial_transactions` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `finance_billing_plans` DROP COLUMN `rate_cents_per_minute`;