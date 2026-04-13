PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_financial_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`owner_type` text NOT NULL,
	`currency_id` text NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`archived_at` integer DEFAULT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`account_type` text DEFAULT 'savings' NOT NULL,
	`overdraft_limit_cents` integer,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "overdraft_limit_non_negative" CHECK("__new_financial_accounts"."overdraft_limit_cents" >= 0),
	CONSTRAINT "owner_type_check" CHECK("__new_financial_accounts"."owner_type" IN ('user', 'org')),
	CONSTRAINT "account_type_check" CHECK("__new_financial_accounts"."account_type" IN ('savings', 'funding', 'treasury', 'system')),
	CONSTRAINT "org_scoped_user_accounts" CHECK("__new_financial_accounts"."account_type" = 'system' OR "__new_financial_accounts"."organization_id" IS NOT NULL),
	CONSTRAINT "balance_within_overdraft" CHECK("__new_financial_accounts"."overdraft_limit_cents" IS NULL OR "__new_financial_accounts"."balance_cents" >= -"__new_financial_accounts"."overdraft_limit_cents")
);
--> statement-breakpoint
INSERT INTO `__new_financial_accounts`("id", "owner_id", "owner_type", "currency_id", "organization_id", "name", "balance_cents", "is_active", "archived_at", "created_at", "updated_at", "account_type", "overdraft_limit_cents") SELECT "id", "owner_id", "owner_type", "currency_id", "organization_id", "name", "balance_cents", "is_active", "archived_at", "created_at", "updated_at", "account_type", "overdraft_limit_cents" FROM `financial_accounts`;--> statement-breakpoint
DROP TABLE `financial_accounts`;--> statement-breakpoint
ALTER TABLE `__new_financial_accounts` RENAME TO `financial_accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `owner_org_name_currency_idx` ON `financial_accounts` (`owner_id`,`organization_id`,`name`,`currency_id`);--> statement-breakpoint
CREATE TABLE `__new_financial_session_payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`event_type` text NOT NULL,
	`transaction_id` text,
	`amount_cents` integer,
	`performed_by` text,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `financial_transactions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`performed_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "event_type_check" CHECK("__new_financial_session_payment_events"."event_type" IN ('paid', 'refunded', 'manual_paid', 'manual_reset')),
	CONSTRAINT "manual_override_note_required" CHECK("__new_financial_session_payment_events"."event_type" NOT IN ('manual_paid', 'manual_reset') OR "__new_financial_session_payment_events"."note" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_financial_session_payment_events`("id", "session_id", "user_id", "organization_id", "event_type", "transaction_id", "amount_cents", "performed_by", "note", "created_at") SELECT "id", "session_id", "user_id", "organization_id", "event_type", "transaction_id", "amount_cents", "performed_by", "note", "created_at" FROM `financial_session_payment_events`;--> statement-breakpoint
DROP TABLE `financial_session_payment_events`;--> statement-breakpoint
ALTER TABLE `__new_financial_session_payment_events` RENAME TO `financial_session_payment_events`;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_spe_session_user_transaction` ON `financial_session_payment_events` (`session_id`,`user_id`,`transaction_id`) WHERE "financial_session_payment_events"."transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_spe_session_user_manual` ON `financial_session_payment_events` (`session_id`,`user_id`,`event_type`) WHERE "financial_session_payment_events"."transaction_id" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_spe_session_id` ON `financial_session_payment_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_user_id` ON `financial_session_payment_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_org_id` ON `financial_session_payment_events` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_created_at` ON `financial_session_payment_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_org_id` ON `financial_transactions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_org_date` ON `financial_transactions` (`organization_id`,`transaction_date`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_source_acc` ON `financial_transactions` (`source_account_id`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_dest_acc` ON `financial_transactions` (`destination_account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_audit_payment_ack` ON `system_audit_events` (`subject_id`,`event_type`) WHERE "system_audit_events"."event_type" = 'payment.acknowledged';
