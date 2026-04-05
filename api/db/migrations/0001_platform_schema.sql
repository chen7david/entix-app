PRAGMA foreign_keys=OFF;
-->statement-breakpoint
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
-->statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);
-->statement-breakpoint
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
-->statement-breakpoint
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
-->statement-breakpoint
CREATE TABLE `social_media_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
-->statement-breakpoint
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
-->statement-breakpoint
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
-->statement-breakpoint
CREATE INDEX `user_upload_userId_idx` ON `user_uploads` (`user_id`);
-->statement-breakpoint
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
-->statement-breakpoint
CREATE INDEX `upload_organizationId_idx` ON `uploads` (`organization_id`);
-->statement-breakpoint
CREATE INDEX `upload_uploadedBy_idx` ON `uploads` (`uploaded_by`);
-->statement-breakpoint
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
-->statement-breakpoint
CREATE INDEX `media_organizationId_idx` ON `media` (`organization_id`);
-->statement-breakpoint
CREATE INDEX `media_uploadedBy_idx` ON `media` (`uploaded_by`);
-->statement-breakpoint
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
-->statement-breakpoint
CREATE INDEX `playlist_organizationId_idx` ON `playlists` (`organization_id`);
-->statement-breakpoint
CREATE INDEX `playlist_createdBy_idx` ON `playlists` (`created_by`);
-->statement-breakpoint
CREATE TABLE `playlist_media` (
	`playlist_id` text NOT NULL,
	`media_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`playlist_id`, `media_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
-->statement-breakpoint
CREATE INDEX `playlist_media_playlistId_idx` ON `playlist_media` (`playlist_id`);
-->statement-breakpoint
CREATE INDEX `playlist_media_mediaId_idx` ON `playlist_media` (`media_id`);
-->statement-breakpoint
CREATE TABLE `scheduled_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`series_id` text,
	`recurrence_rule` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
-->statement-breakpoint
CREATE INDEX `scheduled_session_organizationId_idx` ON `scheduled_sessions` (`organization_id`);
-->statement-breakpoint
CREATE INDEX `scheduled_session_seriesId_idx` ON `scheduled_sessions` (`series_id`);
-->statement-breakpoint
CREATE TABLE `session_attendances` (
	`session_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`absent` integer DEFAULT false NOT NULL,
	`absence_reason` text,
	`notes` text,
	`paid_at` integer,
	PRIMARY KEY(`session_id`, `user_id`),
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
-->statement-breakpoint
CREATE INDEX `session_attendance_sessionId_idx` ON `session_attendances` (`session_id`);
-->statement-breakpoint
CREATE INDEX `session_attendance_userId_idx` ON `session_attendances` (`user_id`);
-->statement-breakpoint
CREATE INDEX `session_attendance_orgId_idx` ON `session_attendances` (`organization_id`);
-->statement-breakpoint
CREATE TABLE `financial_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`default_account_name` text DEFAULT 'Savings' NOT NULL,
	CONSTRAINT "code_format" CHECK(length("financial_currencies"."code") = 3 AND "financial_currencies"."code" = upper("financial_currencies"."code")),
	CONSTRAINT "symbol_length" CHECK(length("financial_currencies"."symbol") <= 5)
);
-->statement-breakpoint
CREATE UNIQUE INDEX `financial_currencies_code_unique` ON `financial_currencies` (`code`);
-->statement-breakpoint
CREATE TABLE `financial_org_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`auto_provision_currencies` text DEFAULT '["fcur_etd", "fcur_cny"]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action
);
-->statement-breakpoint
CREATE UNIQUE INDEX `financial_org_settings_organization_id_unique` ON `financial_org_settings` (`organization_id`);
-->statement-breakpoint
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
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "owner_type_check" CHECK("financial_accounts"."owner_type" IN ('user', 'org')),
	CONSTRAINT "account_type_check" CHECK("financial_accounts"."account_type" IN ('savings', 'funding', 'treasury', 'system')),
	CONSTRAINT "balance_non_negative" CHECK("financial_accounts"."balance_cents" >= 0),
	CONSTRAINT "org_scoped_user_accounts" CHECK("financial_accounts"."organization_id" IS NOT NULL)
);
-->statement-breakpoint
CREATE UNIQUE INDEX `owner_org_name_currency_idx` ON `financial_accounts` (`owner_id`,`organization_id`,`name`,`currency_id`);
-->statement-breakpoint
CREATE TABLE `financial_transaction_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_expense` integer NOT NULL,
	`is_revenue` integer NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "expense_revenue_exclusive" CHECK(NOT ("financial_transaction_categories"."is_expense" = 1 AND "financial_transaction_categories"."is_revenue" = 1))
);
-->statement-breakpoint
CREATE UNIQUE INDEX `financial_transaction_categories_name_unique` ON `financial_transaction_categories` (`name`);
-->statement-breakpoint
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
	`transaction_date` integer NOT NULL,
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
-->statement-breakpoint
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
-->statement-breakpoint
CREATE INDEX `idx_tx_lines_transaction_id` ON `financial_transaction_lines` (`transaction_id`);
-->statement-breakpoint
CREATE INDEX `idx_tx_lines_account_id` ON `financial_transaction_lines` (`account_id`);
-->statement-breakpoint
PRAGMA foreign_keys=ON;
