ALTER TABLE `financial_transactions` ADD `idempotency_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_fin_tx_idempotency` ON `financial_transactions` (`organization_id`,`idempotency_key`);