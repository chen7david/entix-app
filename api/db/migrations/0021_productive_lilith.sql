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
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "owner_type_check" CHECK("__new_financial_accounts"."owner_type" IN ('user', 'org')),
	CONSTRAINT "account_type_check" CHECK("__new_financial_accounts"."account_type" IN ('savings', 'funding', 'treasury', 'system')),
	CONSTRAINT "balance_non_negative" CHECK("__new_financial_accounts"."balance_cents" >= 0),
	CONSTRAINT "org_scoped_user_accounts" CHECK("__new_financial_accounts"."organization_id" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_financial_accounts`("id", "owner_id", "owner_type", "currency_id", "organization_id", "name", "balance_cents", "is_active", "archived_at", "created_at", "updated_at", "account_type") SELECT "id", "owner_id", "owner_type", "currency_id", "organization_id", "name", "balance_cents", "is_active", "archived_at", "created_at", "updated_at", "account_type" FROM `financial_accounts`;--> statement-breakpoint
DROP TABLE `financial_accounts`;--> statement-breakpoint
ALTER TABLE `__new_financial_accounts` RENAME TO `financial_accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `owner_org_name_currency_idx` ON `financial_accounts` (`owner_id`,`organization_id`,`name`,`currency_id`);--> statement-breakpoint
CREATE TABLE `__new_financial_org_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`auto_provision_currencies` text DEFAULT '["fcur_etd", "fcur_cny"]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_financial_org_settings`("id", "organization_id", "auto_provision_currencies", "created_at", "updated_at") SELECT "id", "organization_id", "auto_provision_currencies", "created_at", "updated_at" FROM `financial_org_settings`;--> statement-breakpoint
DROP TABLE `financial_org_settings`;--> statement-breakpoint
ALTER TABLE `__new_financial_org_settings` RENAME TO `financial_org_settings`;--> statement-breakpoint
CREATE UNIQUE INDEX `financial_org_settings_organization_id_unique` ON `financial_org_settings` (`organization_id`);