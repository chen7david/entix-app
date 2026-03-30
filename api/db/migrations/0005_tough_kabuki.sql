-- Migration: 0005_tough_kabuki refinement
-- Module: Financial Accounts Layer (FIN-001)

CREATE TABLE `financial_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL CHECK (length(code) = 3 AND code = upper(code)),
	`name` text NOT NULL,
	`symbol` text NOT NULL CHECK (length(symbol) <= 5),
	`is_active` integer DEFAULT 1 NOT NULL,
    `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_currencies_code_unique` ON `financial_currencies` (`code`);
--> statement-breakpoint

CREATE TABLE `financial_accounts` (
	`id` text PRIMARY KEY NOT NULL,
    -- owner_id is polymorphic: references auth_users.id when owner_type='user'
    -- or auth_organizations.id when owner_type='org'. FK enforced at app layer.
	`owner_id` text NOT NULL,
	`owner_type` text NOT NULL CHECK (owner_type IN ('user', 'org')),
	`currency_id` text NOT NULL,
	`name` text NOT NULL,
	`balance_cents` integer DEFAULT 0 NOT NULL CHECK (balance_cents >= 0),
	`is_active` integer DEFAULT 1 NOT NULL,
	`archived_at` integer, -- NULL = not archived
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint

CREATE TABLE `financial_transaction_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_expense` integer NOT NULL,
	`is_revenue` integer NOT NULL,
    `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
    CHECK (NOT (is_expense = 1 AND is_revenue = 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_transaction_categories_name_unique` ON `financial_transaction_categories` (`name`);
--> statement-breakpoint

-- No updatedAt - transactions are immutable append-only records. 
-- Reversals create a new transaction record.
CREATE TABLE `financial_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text NOT NULL,
	`source_account_id` text NOT NULL,
	`destination_account_id` text NOT NULL,
	`currency_id` text NOT NULL,
	`amount_cents` integer NOT NULL CHECK (amount_cents > 0),
	`status` text DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'reversed')),
	`description` text,
	`transaction_date` integer NOT NULL, -- When the transaction occurred
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL, -- System insertion time
    FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `financial_transaction_categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`source_account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`destination_account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`currency_id`) REFERENCES `financial_currencies`(`id`) ON UPDATE no action ON DELETE restrict,
    CHECK (source_account_id != destination_account_id)
);
--> statement-breakpoint

CREATE TABLE `financial_transaction_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text NOT NULL,
	`direction` text NOT NULL CHECK (direction IN ('debit', 'credit')),
	`amount_cents` integer NOT NULL CHECK (amount_cents > 0),
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `financial_transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `financial_accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_tx_lines_transaction_id` ON `financial_transaction_lines` (`transaction_id`);
--> statement-breakpoint
CREATE INDEX `idx_tx_lines_account_id` ON `financial_transaction_lines` (`account_id`);
