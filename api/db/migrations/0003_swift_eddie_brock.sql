PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session_attendances` (
	`session_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`absent` integer DEFAULT false NOT NULL,
	`absence_reason` text,
	`notes` text,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	PRIMARY KEY(`session_id`, `user_id`),
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "payment_status_check" CHECK("__new_session_attendances"."payment_status" IN ('unpaid', 'paid', 'refunded'))
);
--> statement-breakpoint
INSERT INTO `__new_session_attendances`("session_id", "organization_id", "user_id", "joined_at", "absent", "absence_reason", "notes", "payment_status") SELECT "session_id", "organization_id", "user_id", "joined_at", "absent", "absence_reason", "notes", "payment_status" FROM `session_attendances`;--> statement-breakpoint
DROP TABLE `session_attendances`;--> statement-breakpoint
ALTER TABLE `__new_session_attendances` RENAME TO `session_attendances`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `session_attendance_sessionId_idx` ON `session_attendances` (`session_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_userId_idx` ON `session_attendances` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_orgId_idx` ON `session_attendances` (`organization_id`);