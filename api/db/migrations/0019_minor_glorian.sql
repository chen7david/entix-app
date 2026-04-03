PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`xid` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`theme` text DEFAULT 'system',
	`timezone` text
);
--> statement-breakpoint
INSERT INTO `__new_auth_users`("id", "xid", "name", "email", "email_verified", "image", "created_at", "updated_at", "role", "banned", "ban_reason", "ban_expires", "theme", "timezone") SELECT "id", "xid", "name", "email", "email_verified", "image", "created_at", "updated_at", "role", "banned", "ban_reason", "ban_expires", "theme", "timezone" FROM `auth_users`;--> statement-breakpoint
DROP TABLE `auth_users`;--> statement-breakpoint
ALTER TABLE `__new_auth_users` RENAME TO `auth_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_xid_unique` ON `auth_users` (`xid`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_email_unique` ON `auth_users` (`email`);