CREATE TABLE `financial_session_payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`event_type` text NOT NULL,
	`transaction_id` text,
	`amount_cents` integer,
	`performed_by` text,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `financial_transactions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`performed_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "event_type_check" CHECK("financial_session_payment_events"."event_type" IN ('paid', 'refunded', 'manual_paid', 'manual_reset')),
	CONSTRAINT "manual_override_note_required" CHECK("financial_session_payment_events"."event_type" NOT IN ('manual_paid', 'manual_reset') OR "financial_session_payment_events"."note" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_spe_session_user_transaction` ON `financial_session_payment_events` (`session_id`,`user_id`,`transaction_id`) WHERE "financial_session_payment_events"."transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_spe_session_user_manual` ON `financial_session_payment_events` (`session_id`,`user_id`,`event_type`) WHERE "financial_session_payment_events"."transaction_id" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_spe_session_id` ON `financial_session_payment_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_user_id` ON `financial_session_payment_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_org_id` ON `financial_session_payment_events` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_spe_created_at` ON `financial_session_payment_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_art_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lessons_organization_id_idx` ON `lessons` (`organization_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`log_id` text PRIMARY KEY NOT NULL,
	`enroll_id` text NOT NULL,
	`lesson_element_id` text,
	`action_type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`metric_data` text,
	FOREIGN KEY (`enroll_id`) REFERENCES `session_attendances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_progress_enroll_id_idx` ON `lesson_progress` (`enroll_id`);--> statement-breakpoint
CREATE TABLE `student_vocabulary` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`org_id` text NOT NULL,
	`vocabulary_id` text NOT NULL,
	`attendance_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`org_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary_bank`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attendance_id`) REFERENCES `session_attendances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_vocab_user_vocab_attendance_uidx` ON `student_vocabulary` (`user_id`,`vocabulary_id`,`attendance_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_userId_idx` ON `student_vocabulary` (`user_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_orgId_idx` ON `student_vocabulary` (`org_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_vocabularyId_idx` ON `student_vocabulary` (`vocabulary_id`);--> statement-breakpoint
CREATE INDEX `student_vocab_attendanceId_idx` ON `student_vocabulary` (`attendance_id`);--> statement-breakpoint
CREATE TABLE `vocabulary_bank` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`zh_translation` text,
	`pinyin` text,
	`en_audio_url` text,
	`zh_audio_url` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vocabulary_bank_text_uidx` ON `vocabulary_bank` (`text`);--> statement-breakpoint
CREATE INDEX `vocabulary_bank_status_idx` ON `vocabulary_bank` (`status`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session_attendances` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`absent` integer DEFAULT false NOT NULL,
	`absence_reason` text,
	`notes` text,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `scheduled_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "payment_status_check" CHECK("__new_session_attendances"."payment_status" IN ('unpaid', 'paid', 'refunded'))
);
--> statement-breakpoint
INSERT INTO `__new_session_attendances`("id", "session_id", "organization_id", "user_id", "joined_at", "absent", "absence_reason", "notes", "payment_status") SELECT "id", "session_id", "organization_id", "user_id", "joined_at", "absent", "absence_reason", "notes", "payment_status" FROM `session_attendances`;--> statement-breakpoint
DROP TABLE `session_attendances`;--> statement-breakpoint
ALTER TABLE `__new_session_attendances` RENAME TO `session_attendances`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `session_attendance_session_user_uidx` ON `session_attendances` (`session_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_sessionId_idx` ON `session_attendances` (`session_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_userId_idx` ON `session_attendances` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_orgId_idx` ON `session_attendances` (`organization_id`);--> statement-breakpoint
ALTER TABLE `scheduled_sessions` ADD `lesson_id` text NOT NULL REFERENCES lessons(id);--> statement-breakpoint
ALTER TABLE `scheduled_sessions` ADD `teacher_id` text NOT NULL REFERENCES auth_users(id);--> statement-breakpoint
CREATE INDEX `scheduled_session_lessonId_idx` ON `scheduled_sessions` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_teacherId_idx` ON `scheduled_sessions` (`teacher_id`);