CREATE TABLE `lesson_passages` (
	`lesson_id` text NOT NULL,
	`passage_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`lesson_id`, `passage_id`),
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`passage_id`) REFERENCES `passages`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lesson_passage_position_positive" CHECK("lesson_passages"."position" > 0)
);
--> statement-breakpoint
CREATE INDEX `lp_lesson_idx` ON `lesson_passages` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `lp_passage_idx` ON `lesson_passages` (`passage_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `lp_lesson_position_uidx` ON `lesson_passages` (`lesson_id`,`position`);--> statement-breakpoint
CREATE TABLE `passage_images` (
	`id` text PRIMARY KEY NOT NULL,
	`passage_id` text NOT NULL,
	`upload_id` text,
	`image_url` text NOT NULL,
	`alt_text` text,
	`caption` text,
	`position` text DEFAULT 'bottom' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`passage_id`) REFERENCES `passages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pi_passage_idx` ON `passage_images` (`passage_id`);--> statement-breakpoint
CREATE TABLE `passages` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`collection_id` text,
	`title` text,
	`type` text DEFAULT 'reading' NOT NULL,
	`cefr_level` text,
	`content` text,
	`bucket_key` text,
	`r2_url` text,
	`page_number` integer,
	`word_count` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `text_collections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ps_org_idx` ON `passages` (`organization_id`);--> statement-breakpoint
CREATE INDEX `ps_collection_idx` ON `passages` (`collection_id`);--> statement-breakpoint
CREATE TABLE `text_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`description` text,
	`type` text DEFAULT 'book' NOT NULL,
	`cefr_level` text,
	`bucket_key` text,
	`r2_url` text,
	`total_pages` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tc_org_idx` ON `text_collections` (`organization_id`);