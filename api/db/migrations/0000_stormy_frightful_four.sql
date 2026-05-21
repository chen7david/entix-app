CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `auth_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_unique` ON `auth_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`xid` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT 0 NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT 0 NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`theme` text DEFAULT 'system',
	`timezone` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_xid_unique` ON `auth_users` (`xid`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_email_unique` ON `auth_users` (`email`);--> statement-breakpoint
CREATE TABLE `auth_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `auth_verifications` (`identifier`);--> statement-breakpoint
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
CREATE TABLE `finance_billing_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`currency_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`overdraft_limit_cents` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "overdraft_limit_non_negative" CHECK("finance_billing_plans"."overdraft_limit_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_billing_plans_org_id` ON `finance_billing_plans` (`organization_id`);--> statement-breakpoint
CREATE TABLE `finance_member_billing_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`billing_plan_id` text NOT NULL,
	`currency_id` text NOT NULL,
	`assigned_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`assigned_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`billing_plan_id`) REFERENCES `finance_billing_plans`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_member_billing_currency_per_org` ON `finance_member_billing_plans` (`user_id`,`organization_id`,`currency_id`);--> statement-breakpoint
CREATE TABLE `financial_accounts` (
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
	CONSTRAINT "overdraft_limit_non_negative" CHECK("financial_accounts"."overdraft_limit_cents" >= 0),
	CONSTRAINT "owner_type_check" CHECK("financial_accounts"."owner_type" IN ('user', 'org')),
	CONSTRAINT "account_type_check" CHECK("financial_accounts"."account_type" IN ('savings', 'funding', 'treasury', 'system')),
	CONSTRAINT "org_scoped_user_accounts" CHECK("financial_accounts"."account_type" = 'system' OR "financial_accounts"."organization_id" IS NOT NULL),
	CONSTRAINT "balance_within_overdraft" CHECK("financial_accounts"."overdraft_limit_cents" IS NULL OR "financial_accounts"."balance_cents" >= -"financial_accounts"."overdraft_limit_cents")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `owner_org_name_currency_idx` ON `financial_accounts` (`owner_id`,`organization_id`,`name`,`currency_id`);--> statement-breakpoint
CREATE TABLE `financial_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`default_account_name` text DEFAULT 'Savings' NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "code_format" CHECK(length("financial_currencies"."code") = 3 AND "financial_currencies"."code" = upper("financial_currencies"."code")),
	CONSTRAINT "symbol_length" CHECK(length("financial_currencies"."symbol") <= 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_currencies_code_unique` ON `financial_currencies` (`code`);--> statement-breakpoint
CREATE TABLE `financial_org_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`auto_provision_currencies` text DEFAULT '["fcur_etd", "fcur_cny"]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_org_settings_organization_id_unique` ON `financial_org_settings` (`organization_id`);--> statement-breakpoint
CREATE TABLE `financial_session_payment_events` (
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
	CONSTRAINT "event_type_check" CHECK("financial_session_payment_events"."event_type" IN ('paid', 'refunded', 'manual_paid', 'manual_reset')),
	CONSTRAINT "manual_override_note_required" CHECK("financial_session_payment_events"."event_type" NOT IN ('manual_paid', 'manual_reset') OR "financial_session_payment_events"."note" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_spe_session_user_transaction` ON `financial_session_payment_events` (`session_id`,`user_id`,`transaction_id`) WHERE "financial_session_payment_events"."transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_spe_session_user_manual` ON `financial_session_payment_events` (`session_id`,`user_id`,`event_type`) WHERE "financial_session_payment_events"."transaction_id" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_spe_session_id` ON `financial_session_payment_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_user_id` ON `financial_session_payment_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_org_id` ON `financial_session_payment_events` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_created_at` ON `financial_session_payment_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `financial_transaction_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_expense` integer NOT NULL,
	`is_revenue` integer NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "expense_revenue_exclusive" CHECK(NOT ("financial_transaction_categories"."is_expense" = 1 AND "financial_transaction_categories"."is_revenue" = 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_transaction_categories_name_unique` ON `financial_transaction_categories` (`name`);--> statement-breakpoint
CREATE TABLE `financial_transaction_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text NOT NULL,
	`direction` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `financial_transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "direction_check" CHECK("financial_transaction_lines"."direction" IN ('debit', 'credit')),
	CONSTRAINT "amount_cents_positive" CHECK("financial_transaction_lines"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_tx_lines_transaction_id` ON `financial_transaction_lines` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_tx_lines_account_id` ON `financial_transaction_lines` (`account_id`);--> statement-breakpoint
CREATE TABLE `financial_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text NOT NULL,
	`source_account_id` text NOT NULL,
	`destination_account_id` text NOT NULL,
	`currency_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`description` text,
	`metadata` text,
	`transaction_date` integer NOT NULL,
	`idempotency_key` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `financial_transaction_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`destination_account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "amount_cents_positive" CHECK("financial_transactions"."amount_cents" > 0),
	CONSTRAINT "status_values" CHECK("financial_transactions"."status" IN ('pending', 'completed', 'reversed')),
	CONSTRAINT "source_dest_different" CHECK("financial_transactions"."source_account_id" != "financial_transactions"."destination_account_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tx_idem` ON `financial_transactions` (`organization_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_org_id` ON `financial_transactions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_org_date` ON `financial_transactions` (`organization_id`,`transaction_date`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_source_acc` ON `financial_transactions` (`source_account_id`);--> statement-breakpoint
CREATE INDEX `idx_fin_tx_dest_acc` ON `financial_transactions` (`destination_account_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_art_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lessons_organization_id_idx` ON `lessons` (`organization_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`log_id` text PRIMARY KEY NOT NULL,
	`enroll_id` text NOT NULL,
	`lesson_element_id` text,
	`action_type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`metric_data` text,
	FOREIGN KEY (`enroll_id`) REFERENCES `session_attendances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_progress_enroll_id_idx` ON `lesson_progress` (`enroll_id`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`mime_type` text NOT NULL,
	`media_url` text NOT NULL,
	`cover_art_url` text,
	`play_count` integer DEFAULT 0 NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_organizationId_idx` ON `media` (`organization_id`);--> statement-breakpoint
CREATE INDEX `media_uploadedBy_idx` ON `media` (`uploaded_by`);--> statement-breakpoint
CREATE TABLE `playlist_media` (
	`playlist_id` text NOT NULL,
	`media_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`playlist_id`, `media_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_media_playlistId_idx` ON `playlist_media` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `playlist_media_mediaId_idx` ON `playlist_media` (`media_id`);--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_art_url` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_organizationId_idx` ON `playlists` (`organization_id`);--> statement-breakpoint
CREATE INDEX `playlist_createdBy_idx` ON `playlists` (`created_by`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`bucket_key` text NOT NULL,
	`url` text NOT NULL,
	`file_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`organization_id` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `upload_organizationId_idx` ON `uploads` (`organization_id`);--> statement-breakpoint
CREATE INDEX `upload_uploadedBy_idx` ON `uploads` (`uploaded_by`);--> statement-breakpoint
CREATE TABLE `user_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`original_name` text NOT NULL,
	`bucket_key` text NOT NULL,
	`url` text NOT NULL,
	`file_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_upload_userId_idx` ON `user_uploads` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitation_organizationId_idx` ON `auth_invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `auth_invitations` (`email`);--> statement-breakpoint
CREATE TABLE `auth_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `member_organizationId_idx` ON `auth_members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_userId_idx` ON `auth_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `member_org_user_uidx` ON `auth_members` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `auth_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`created_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_organizations_slug_unique` ON `auth_organizations` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_uidx` ON `auth_organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `payment_requests` (
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
	CONSTRAINT "pr_type_check" CHECK("payment_requests"."type" IN ('session_payment', 'manual_payment')),
	CONSTRAINT "pr_status_check" CHECK("payment_requests"."status" IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
	CONSTRAINT "pr_amount_non_negative" CHECK("payment_requests"."amount_cents" >= 0),
	CONSTRAINT "pr_attempt_count_non_negative" CHECK("payment_requests"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payment_request_idempotency_key` ON `payment_requests` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_pr_organization_id` ON `payment_requests` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_pr_status` ON `payment_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_pr_reference` ON `payment_requests` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `idx_pr_created_at` ON `payment_requests` (`created_at`);--> statement-breakpoint
CREATE TABLE `scheduled_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`series_id` text,
	`recurrence_rule` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scheduled_session_organizationId_idx` ON `scheduled_sessions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_lessonId_idx` ON `scheduled_sessions` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_teacherId_idx` ON `scheduled_sessions` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_seriesId_idx` ON `scheduled_sessions` (`series_id`);--> statement-breakpoint
CREATE TABLE `session_attendances` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`absent` integer DEFAULT false NOT NULL,
	`absence_reason` text,
	`notes` text,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "payment_status_check" CHECK("session_attendances"."payment_status" IN ('unpaid', 'paid', 'refunded'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_attendance_session_user_uidx` ON `session_attendances` (`session_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_sessionId_idx` ON `session_attendances` (`session_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_userId_idx` ON `session_attendances` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_orgId_idx` ON `session_attendances` (`organization_id`);--> statement-breakpoint
CREATE TABLE `social_media_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_social_medias` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`social_media_type_id` text NOT NULL,
	`url_or_handle` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`social_media_type_id`) REFERENCES `social_media_types`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `student_vocabulary` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`org_id` text NOT NULL,
	`vocabulary_id` text NOT NULL,
	`attendance_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`org_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary_bank`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attendance_id`) REFERENCES `session_attendances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_vocab_user_vocab_attendance_uidx` ON `student_vocabulary` (`user_id`,`vocabulary_id`,`attendance_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_userId_idx` ON `student_vocabulary` (`user_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_orgId_idx` ON `student_vocabulary` (`org_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_vocabularyId_idx` ON `student_vocabulary` (`vocabulary_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_attendanceId_idx` ON `student_vocabulary` (`attendance_id`);--> statement-breakpoint
CREATE TABLE `system_audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`event_type` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`actor_id` text,
	`actor_type` text DEFAULT 'system' NOT NULL,
	`subject_type` text,
	`subject_id` text,
	`message` text NOT NULL,
	`metadata` text,
	`acknowledged_at` integer,
	`acknowledged_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`acknowledged_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "severity_check" CHECK("system_audit_events"."severity" IN ('info', 'warning', 'error', 'critical')),
	CONSTRAINT "actor_type_check" CHECK("system_audit_events"."actor_type" IN ('system', 'user', 'admin'))
);
--> statement-breakpoint
CREATE INDEX `idx_audit_org_id` ON `system_audit_events` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_severity` ON `system_audit_events` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_audit_event_type` ON `system_audit_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_audit_acknowledged` ON `system_audit_events` (`acknowledged_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `system_audit_events` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_audit_payment_ack` ON `system_audit_events` (`subject_id`,`event_type`) WHERE "system_audit_events"."event_type" = 'payment.acknowledged';--> statement-breakpoint
CREATE TABLE `user_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`country` text NOT NULL,
	`state` text NOT NULL,
	`city` text NOT NULL,
	`zip` text NOT NULL,
	`address` text NOT NULL,
	`label` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_phone_numbers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`country_code` text NOT NULL,
	`number` text NOT NULL,
	`extension` text,
	`label` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`display_name` text,
	`sex` text NOT NULL,
	`birth_date` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `vocabulary_bank` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`zh_translation` text,
	`pinyin` text,
	`en_audio_url` text,
	`zh_audio_url` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vocabulary_bank_text_uidx` ON `vocabulary_bank` (`text`);--> statement-breakpoint
CREATE INDEX `vocabulary_bank_status_idx` ON `vocabulary_bank` (`status`);