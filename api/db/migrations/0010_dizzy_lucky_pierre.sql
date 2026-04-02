DROP INDEX `owner_name_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `owner_name_currency_idx` ON `financial_accounts` (`owner_id`,`name`,`currency_id`);