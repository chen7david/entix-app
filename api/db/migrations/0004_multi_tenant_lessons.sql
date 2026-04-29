PRAGMA foreign_keys=OFF;--> statement-breakpoint

DROP TABLE IF EXISTS `lesson_progress`;--> statement-breakpoint
DROP TABLE IF EXISTS `session_attendances`;--> statement-breakpoint
DROP TABLE IF EXISTS `scheduled_sessions`;--> statement-breakpoint
DROP TABLE IF EXISTS `lessons`;--> statement-breakpoint

CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `lessons_organization_id_idx` ON `lessons` (`organization_id`);--> statement-breakpoint

CREATE TABLE `scheduled_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`series_id` text,
	`recurrence_rule` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `scheduled_session_organizationId_idx` ON `scheduled_sessions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_lessonId_idx` ON `scheduled_sessions` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_teacherId_idx` ON `scheduled_sessions` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `scheduled_session_seriesId_idx` ON `scheduled_sessions` (`series_id`);--> statement-breakpoint

CREATE TABLE `session_attendances` (
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
	CONSTRAINT "payment_status_check" CHECK("session_attendances"."payment_status" IN ('unpaid', 'paid', 'refunded'))
);--> statement-breakpoint
CREATE UNIQUE INDEX `session_attendance_session_user_uidx` ON `session_attendances` (`session_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_id_idx` ON `session_attendances` (`id`);--> statement-breakpoint
CREATE INDEX `session_attendance_sessionId_idx` ON `session_attendances` (`session_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_userId_idx` ON `session_attendances` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_attendance_orgId_idx` ON `session_attendances` (`organization_id`);--> statement-breakpoint

CREATE TABLE `lesson_progress` (
	`log_id` text PRIMARY KEY NOT NULL,
	`enroll_id` text NOT NULL,
	`lesson_element_id` text,
	`action_type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`metric_data` text,
	FOREIGN KEY (`enroll_id`) REFERENCES `session_attendances`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `lesson_progress_enroll_id_idx` ON `lesson_progress` (`enroll_id`);--> statement-breakpoint

PRAGMA foreign_keys=ON;
