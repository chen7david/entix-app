PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`bucket_key` text NOT NULL,
	`url` text NOT NULL,
	`file_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`organization_id` text NOT NULL,
	`uploaded_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_uploads`("id", "original_name", "bucket_key", "url", "file_size", "content_type", "status", "organization_id", "uploaded_by", "created_at", "updated_at") SELECT "id", "original_name", "bucket_key", "url", "file_size", "content_type", "status", "organization_id", "uploaded_by", "created_at", "updated_at" FROM `uploads`;--> statement-breakpoint
DROP TABLE `uploads`;--> statement-breakpoint
ALTER TABLE `__new_uploads` RENAME TO `uploads`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `upload_organizationId_idx` ON `uploads` (`organization_id`);--> statement-breakpoint
CREATE INDEX `upload_uploadedBy_idx` ON `uploads` (`uploaded_by`);--> statement-breakpoint
CREATE UNIQUE INDEX `upload_org_bucket_key_uidx` ON `uploads` (`organization_id`,`bucket_key`);--> statement-breakpoint
CREATE TABLE `__new_payment_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency_id` text NOT NULL,
	`source_account_id` text NOT NULL,
	`destination_account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text NOT NULL,
	`transaction_id` text,
	`requested_by` text,
	`user_id` text,
	`note` text,
	`failure_reason` text,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`last_attempted_at` integer,
	`processed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`destination_account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `financial_transaction_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `financial_transactions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`requested_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "pr_type_check" CHECK("__new_payment_requests"."type" IN ('session_payment', 'manual_payment')),
	CONSTRAINT "pr_status_check" CHECK("__new_payment_requests"."status" IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
	CONSTRAINT "pr_amount_non_negative" CHECK("__new_payment_requests"."amount_cents" >= 0),
	CONSTRAINT "pr_attempt_count_non_negative" CHECK("__new_payment_requests"."attempt_count" >= 0),
	CONSTRAINT "pr_session_payment_user_required" CHECK("__new_payment_requests"."type" != 'session_payment' OR "__new_payment_requests"."user_id" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_payment_requests`("id", "organization_id", "type", "status", "amount_cents", "currency_id", "source_account_id", "destination_account_id", "category_id", "idempotency_key", "reference_type", "reference_id", "transaction_id", "requested_by", "user_id", "note", "failure_reason", "attempt_count", "last_attempted_at", "processed_at", "created_at", "updated_at") SELECT "id", "organization_id", "type", "status", "amount_cents", "currency_id", "source_account_id", "destination_account_id", "category_id", "idempotency_key", "reference_type", "reference_id", "transaction_id", "requested_by", "user_id", "note", "failure_reason", "attempt_count", "last_attempted_at", "processed_at", "created_at", "updated_at" FROM `payment_requests`;--> statement-breakpoint
DROP TABLE `payment_requests`;--> statement-breakpoint
ALTER TABLE `__new_payment_requests` RENAME TO `payment_requests`;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payment_request_idempotency_key` ON `payment_requests` (`organization_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_pr_organization_id` ON `payment_requests` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_pr_status` ON `payment_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_pr_reference` ON `payment_requests` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `idx_pr_created_at` ON `payment_requests` (`created_at`);