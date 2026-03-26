PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`bucket_key` text NOT NULL,
	`url` text NOT NULL,
	`file_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`organization_id` text,
	`uploaded_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_uploads`("id", "original_name", "bucket_key", "url", "file_size", "content_type", "status", "organization_id", "uploaded_by", "created_at", "updated_at") SELECT "id", "original_name", "bucket_key", "url", "file_size", "content_type", "status", "organization_id", "uploaded_by", "created_at", "updated_at" FROM `uploads`;--> statement-breakpoint
DROP TABLE `uploads`;--> statement-breakpoint
ALTER TABLE `__new_uploads` RENAME TO `uploads`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `upload_organizationId_idx` ON `uploads` (`organization_id`);--> statement-breakpoint
CREATE INDEX `upload_uploadedBy_idx` ON `uploads` (`uploaded_by`);