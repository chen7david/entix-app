CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`mime_type` text NOT NULL,
	`media_url` text NOT NULL,
	`cover_art_url` text,
	`play_count` integer DEFAULT 0 NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_organizationId_idx` ON `media` (`organization_id`);--> statement-breakpoint
CREATE INDEX `media_uploadedBy_idx` ON `media` (`uploaded_by`);