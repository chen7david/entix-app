CREATE TABLE `upload` (
	`id` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`bucket_key` text NOT NULL,
	`url` text NOT NULL,
	`file_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`organization_id` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `upload_organizationId_idx` ON `upload` (`organization_id`);--> statement-breakpoint
CREATE INDEX `upload_uploadedBy_idx` ON `upload` (`uploaded_by`);