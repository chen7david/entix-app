CREATE TABLE `financial_account` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text,
	`currency` text NOT NULL,
	`type` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`code` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_account_code_unique` ON `financial_account` (`code`);--> statement-breakpoint
CREATE INDEX `financial_account_org_idx` ON `financial_account` (`organization_id`);--> statement-breakpoint
CREATE INDEX `financial_account_user_idx` ON `financial_account` (`user_id`);--> statement-breakpoint
CREATE TABLE `financial_posting` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `financial_transaction`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `financial_account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `financial_posting_tx_idx` ON `financial_posting` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `financial_posting_account_idx` ON `financial_posting` (`account_id`);--> statement-breakpoint
CREATE TABLE `financial_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`reference` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `financial_transaction_org_idx` ON `financial_transaction` (`organization_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `transaction_pin` text;