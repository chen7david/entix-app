CREATE TABLE `scheduled_session` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`series_id` text,
	`recurrence_rule` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scheduled_session_organizationId_idx` ON `scheduled_session` (`organization_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_seriesId_idx` ON `scheduled_session` (`series_id`);--> statement-breakpoint
CREATE TABLE `scheduled_session_participant` (
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`session_id`, `user_id`),
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scheduled_session_participant_sessionId_idx` ON `scheduled_session_participant` (`session_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_participant_userId_idx` ON `scheduled_session_participant` (`user_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `timezone` text;