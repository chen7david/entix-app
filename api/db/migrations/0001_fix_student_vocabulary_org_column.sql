ALTER TABLE `student_vocabulary` RENAME COLUMN `org_id` TO `organization_id`;
--> statement-breakpoint
DROP INDEX IF EXISTS `student_vocab_orgId_idx`;
--> statement-breakpoint
CREATE INDEX `student_vocab_organizationId_idx` ON `student_vocabulary` (`organization_id`);
