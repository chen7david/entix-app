ALTER TABLE `scheduled_session_participant` ADD `absent` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduled_session_participant` ADD `absence_reason` text;--> statement-breakpoint
ALTER TABLE `scheduled_session_participant` ADD `notes` text;