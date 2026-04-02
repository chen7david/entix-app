PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_financial_transactions` (
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
	CONSTRAINT "amount_cents_positive" CHECK("__new_financial_transactions"."amount_cents" > 0),
	CONSTRAINT "status_values" CHECK("__new_financial_transactions"."status" IN ('pending', 'completed', 'reversed')),
	CONSTRAINT "source_dest_different" CHECK("__new_financial_transactions"."source_account_id" != "__new_financial_transactions"."destination_account_id")
);
--> statement-breakpoint
INSERT INTO `__new_financial_transactions`("id", "organization_id", "category_id", "source_account_id", "destination_account_id", "currency_id", "amount_cents", "status", "description", "transaction_date", "created_at") SELECT "id", "organization_id", "category_id", "source_account_id", "destination_account_id", "currency_id", "amount_cents", "status", "description", "transaction_date", "created_at" FROM `financial_transactions`;--> statement-breakpoint
DROP TABLE `financial_transactions`;--> statement-breakpoint
ALTER TABLE `__new_financial_transactions` RENAME TO `financial_transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_financial_transaction_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text NOT NULL,
	`direction` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `financial_transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "direction_check" CHECK("__new_financial_transaction_lines"."direction" IN ('debit', 'credit')),
	CONSTRAINT "amount_cents_positive" CHECK("__new_financial_transaction_lines"."amount_cents" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_financial_transaction_lines`("id", "transaction_id", "account_id", "direction", "amount_cents", "created_at") SELECT "id", "transaction_id", "account_id", "direction", "amount_cents", "created_at" FROM `financial_transaction_lines`;--> statement-breakpoint
DROP TABLE `financial_transaction_lines`;--> statement-breakpoint
ALTER TABLE `__new_financial_transaction_lines` RENAME TO `financial_transaction_lines`;--> statement-breakpoint
CREATE INDEX `idx_tx_lines_transaction_id` ON `financial_transaction_lines` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_tx_lines_account_id` ON `financial_transaction_lines` (`account_id`);--> statement-breakpoint
CREATE TABLE `__new_financial_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`owner_type` text NOT NULL,
	`currency_id` text NOT NULL,
	`name` text NOT NULL,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`archived_at` integer DEFAULT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "owner_type_check" CHECK("__new_financial_accounts"."owner_type" IN ('user', 'org')),
	CONSTRAINT "balance_non_negative" CHECK("__new_financial_accounts"."balance_cents" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_financial_accounts`("id", "owner_id", "owner_type", "currency_id", "name", "balance_cents", "is_active", "archived_at", "created_at", "updated_at") SELECT "id", "owner_id", "owner_type", "currency_id", "name", "balance_cents", "is_active", "archived_at", "created_at", "updated_at" FROM `financial_accounts`;--> statement-breakpoint
DROP TABLE `financial_accounts`;--> statement-breakpoint
ALTER TABLE `__new_financial_accounts` RENAME TO `financial_accounts`;--> statement-breakpoint
CREATE TABLE `__new_financial_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "code_format" CHECK(length("__new_financial_currencies"."code") = 3 AND "__new_financial_currencies"."code" = upper("__new_financial_currencies"."code")),
	CONSTRAINT "symbol_length" CHECK(length("__new_financial_currencies"."symbol") <= 5)
);
--> statement-breakpoint
INSERT INTO `__new_financial_currencies`("id", "code", "name", "symbol", "archived_at", "created_at") SELECT "id", "code", "name", "symbol", "archived_at", "created_at" FROM `financial_currencies`;--> statement-breakpoint
DROP TABLE `financial_currencies`;--> statement-breakpoint
ALTER TABLE `__new_financial_currencies` RENAME TO `financial_currencies`;--> statement-breakpoint
CREATE UNIQUE INDEX `financial_currencies_code_unique` ON `financial_currencies` (`code`);--> statement-breakpoint
CREATE TABLE `__new_financial_transaction_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_expense` integer NOT NULL,
	`is_revenue` integer NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "expense_revenue_exclusive" CHECK(NOT ("__new_financial_transaction_categories"."is_expense" = 1 AND "__new_financial_transaction_categories"."is_revenue" = 1))
);
--> statement-breakpoint
INSERT INTO `__new_financial_transaction_categories`("id", "name", "is_expense", "is_revenue", "archived_at", "created_at") SELECT "id", "name", "is_expense", "is_revenue", "archived_at", "created_at" FROM `financial_transaction_categories`;--> statement-breakpoint
DROP TABLE `financial_transaction_categories`;--> statement-breakpoint
ALTER TABLE `__new_financial_transaction_categories` RENAME TO `financial_transaction_categories`;--> statement-breakpoint
CREATE UNIQUE INDEX `financial_transaction_categories_name_unique` ON `financial_transaction_categories` (`name`);