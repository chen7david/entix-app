CREATE TABLE `media_metadata` (
	`media_id` text PRIMARY KEY NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`external_id` text,
	`external_like_count` integer DEFAULT 0 NOT NULL,
	`external_view_count` integer DEFAULT 0 NOT NULL,
	`channel_name` text,
	`channel_id` text,
	`tags` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_subtitles` (
	`id` text PRIMARY KEY NOT NULL,
	`media_id` text NOT NULL,
	`language` text NOT NULL,
	`label` text NOT NULL,
	`mime_type` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_subtitles_mediaId_idx` ON `media_subtitles` (`media_id`);