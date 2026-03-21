ALTER TABLE `scheduled_session_participant` RENAME TO `session_attendance`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session_attendance` (
	`session_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`absent` integer DEFAULT false NOT NULL,
	`absence_reason` text,
	`notes` text,
	`paid_at` integer,
	PRIMARY KEY(`session_id`, `user_id`),
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Dropped INSERT data copy because old memberIds cannot map into composite userIds cleanly
DROP TABLE `session_attendance`;--> statement-breakpoint
ALTER TABLE `__new_session_attendance` RENAME TO `session_attendance`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `session_attendance_sessionId_idx` ON `session_attendance` (`session_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_userId_idx` ON `session_attendance` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_orgId_idx` ON `session_attendance` (`organization_id`);