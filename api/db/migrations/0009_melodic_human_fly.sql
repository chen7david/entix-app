CREATE TABLE `playlist` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_art_url` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_organizationId_idx` ON `playlist` (`organization_id`);--> statement-breakpoint
CREATE INDEX `playlist_createdBy_idx` ON `playlist` (`created_by`);--> statement-breakpoint
CREATE TABLE `playlist_media` (
	`playlist_id` text NOT NULL,
	`media_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`playlist_id`, `media_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlist`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_media_playlistId_idx` ON `playlist_media` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `playlist_media_mediaId_idx` ON `playlist_media` (`media_id`);