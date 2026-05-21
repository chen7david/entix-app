-- vocabulary_bank: pipeline stages `queued_text` / `queued_audio` (claim-before-enqueue).
-- Tag name "queued_dispatch_*" is shorthand for that pattern, not a status value.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_vocabulary_bank` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`zh_translation` text,
	`pinyin` text,
	`needs_language_review` integer,
	`ipa_us` text,
	`syllables_en` text,
	`syllables_ipa` text,
	`definition_simple` text,
	`en_audio_url` text,
	`zh_audio_url` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "vb_status_check" CHECK("__new_vocabulary_bank"."status" IN ('new', 'queued_text', 'processing_text', 'text_ready', 'queued_audio', 'processing_audio', 'active', 'review'))
);
--> statement-breakpoint
INSERT INTO `__new_vocabulary_bank`("id", "text", "zh_translation", "pinyin", "needs_language_review", "ipa_us", "syllables_en", "syllables_ipa", "definition_simple", "en_audio_url", "zh_audio_url", "status", "created_at", "updated_at") SELECT "id", "text", "zh_translation", "pinyin", "needs_language_review", "ipa_us", "syllables_en", "syllables_ipa", "definition_simple", "en_audio_url", "zh_audio_url", "status", "created_at", "updated_at" FROM `vocabulary_bank`;--> statement-breakpoint
DROP TABLE `vocabulary_bank`;--> statement-breakpoint
ALTER TABLE `__new_vocabulary_bank` RENAME TO `vocabulary_bank`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `vocabulary_bank_text_uidx` ON `vocabulary_bank` (`text`);--> statement-breakpoint
CREATE INDEX `vocabulary_bank_status_idx` ON `vocabulary_bank` (`status`);
