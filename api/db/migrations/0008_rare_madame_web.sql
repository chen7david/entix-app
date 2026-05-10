CREATE TABLE `lesson_objectives` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`objective` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "objective_not_empty" CHECK(length(trim("lesson_objectives"."objective")) > 0),
	CONSTRAINT "objective_position_positive" CHECK("lesson_objectives"."position" > 0)
);
--> statement-breakpoint
CREATE INDEX `lesson_objectives_lesson_id_idx` ON `lesson_objectives` (`lesson_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_objectives_lesson_id_position_uidx` ON `lesson_objectives` (`lesson_id`,`position`);--> statement-breakpoint
CREATE TABLE `lesson_playlists` (
	`lesson_id` text NOT NULL,
	`playlist_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`lesson_id`, `playlist_id`),
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lesson_playlist_position_positive" CHECK("lesson_playlists"."position" > 0)
);
--> statement-breakpoint
CREATE INDEX `lesson_playlists_lesson_id_idx` ON `lesson_playlists` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_playlists_playlist_id_idx` ON `lesson_playlists` (`playlist_id`);--> statement-breakpoint
CREATE TABLE `lesson_vocabulary` (
	`lesson_id` text NOT NULL,
	`vocabulary_id` text NOT NULL,
	`position` integer NOT NULL,
	`added_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`lesson_id`, `vocabulary_id`),
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary_bank`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lesson_vocab_position_positive" CHECK("lesson_vocabulary"."position" > 0)
);
--> statement-breakpoint
CREATE INDEX `lesson_vocabulary_lesson_id_idx` ON `lesson_vocabulary` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_vocabulary_vocab_id_idx` ON `lesson_vocabulary` (`vocabulary_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_art_url` text,
	`cefr_level` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "cefr_level_check" CHECK("__new_lessons"."cefr_level" IS NULL OR "__new_lessons"."cefr_level" IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'))
);
--> statement-breakpoint
INSERT INTO `__new_lessons`("id", "organization_id", "title", "description", "cover_art_url", "cefr_level", "created_at", "updated_at") SELECT "id", "organization_id", "title", "description", "cover_art_url", "cefr_level", "created_at", "updated_at" FROM `lessons`;--> statement-breakpoint
DROP TABLE `lessons`;--> statement-breakpoint
ALTER TABLE `__new_lessons` RENAME TO `lessons`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `lessons_organization_id_idx` ON `lessons` (`organization_id`);
