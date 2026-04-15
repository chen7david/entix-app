DROP INDEX `idx_fin_tx_idempotency`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tx_idem` ON `financial_transactions` (`organization_id`,`idempotency_key`);