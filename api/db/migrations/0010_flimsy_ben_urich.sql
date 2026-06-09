CREATE TABLE `import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`collection_id` text,
	`status` text DEFAULT 'uploading' NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`bucket_key` text,
	`total_paragraphs` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `auth_organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `text_collections`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ij_org_idx` ON `import_jobs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `ij_status_idx` ON `import_jobs` (`status`);--> statement-breakpoint
CREATE TABLE `import_job_paragraphs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`page_number` integer NOT NULL,
	`paragraph_index` integer NOT NULL,
	`raw_text` text NOT NULL,
	`cleaned_text` text,
	`clean_status` text DEFAULT 'pending' NOT NULL,
	`last_error` text,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `import_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ijp_job_idx` ON `import_job_paragraphs` (`job_id`);--> statement-breakpoint
CREATE INDEX `ijp_clean_status_idx` ON `import_job_paragraphs` (`clean_status`);--> statement-breakpoint
CREATE INDEX `ijp_job_order_idx` ON `import_job_paragraphs` (`job_id`,`page_number`,`paragraph_index`);
