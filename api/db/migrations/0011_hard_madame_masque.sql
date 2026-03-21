PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scheduled_session_participant` (
	`session_id` text NOT NULL,
	`member_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`session_id`, `member_id`),
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_scheduled_session_participant`("session_id", "member_id", "joined_at") SELECT "session_id", "member_id", "joined_at" FROM `scheduled_session_participant`;--> statement-breakpoint
DROP TABLE `scheduled_session_participant`;--> statement-breakpoint
ALTER TABLE `__new_scheduled_session_participant` RENAME TO `scheduled_session_participant`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `scheduled_session_participant_sessionId_idx` ON `scheduled_session_participant` (`session_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_participant_memberId_idx` ON `scheduled_session_participant` (`member_id`);