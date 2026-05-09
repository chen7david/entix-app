ALTER TABLE `financial_transaction_categories` ADD `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL;--> statement-breakpoint
UPDATE `financial_transaction_categories` SET `updated_at` = `created_at`;
