ALTER TABLE `scheduled_sessions` ADD `teacher_user_id` text REFERENCES auth_users(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `scheduled_session_teacherUserId_idx` ON `scheduled_sessions` (`teacher_user_id`);
