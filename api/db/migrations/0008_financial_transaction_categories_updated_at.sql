-- Drizzle-kit emits ALTER ADD unixepoch DEFAULT; D1 rejects that. Same end state as `0008_*` snapshot; CHECK columns unqualified so CREATE + RENAME stay valid SQLite.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_financial_transaction_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_expense` integer NOT NULL,
	`is_revenue` integer NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "expense_revenue_exclusive" CHECK(NOT ("is_expense" = 1 AND "is_revenue" = 1))
);
--> statement-breakpoint
INSERT INTO `__new_financial_transaction_categories`("id", "name", "is_expense", "is_revenue", "archived_at", "created_at", "updated_at") SELECT "id", "name", "is_expense", "is_revenue", "archived_at", "created_at", "created_at" FROM `financial_transaction_categories`;--> statement-breakpoint
DROP TABLE `financial_transaction_categories`;--> statement-breakpoint
ALTER TABLE `__new_financial_transaction_categories` RENAME TO `financial_transaction_categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `financial_transaction_categories_name_unique` ON `financial_transaction_categories` (`name`);
