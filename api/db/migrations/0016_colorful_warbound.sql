DROP INDEX `one_default_funding_per_currency_idx`;--> statement-breakpoint
ALTER TABLE `financial_accounts` ADD `is_funding_account` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `financial_accounts` DROP COLUMN `is_default_funding`;