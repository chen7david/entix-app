import { IMPORT_FILE_TYPES, IMPORT_JOB_STATUSES, IMPORT_PARA_CLEAN_STATUSES } from "../../constants/import";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";
import { authUsers } from "./auth.schema";
import { authOrganizations } from "./organization.schema";
import { textCollections } from "./text-collections.schema";

export {
    IMPORT_FILE_TYPES,
    type ImportFileType,
    IMPORT_JOB_STATUSES,
    type ImportJobStatus,
    IMPORT_PARA_CLEAN_STATUSES,
    type ImportParaCleanStatus,
} from "../../constants/import";

export const importJobs = sqliteTable(
    "import_jobs",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        collectionId: text("collection_id").references(() => textCollections.id, {
            onDelete: "set null",
        }),
        status: text("status", { enum: IMPORT_JOB_STATUSES }).notNull().default("uploading"),
        fileName: text("file_name").notNull(),
        fileType: text("file_type", { enum: IMPORT_FILE_TYPES }).notNull(),
        bucketKey: text("bucket_key"),
        totalParagraphs: integer("total_paragraphs"),
        createdBy: text("created_by")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("ij_org_idx").on(table.organizationId),
        index("ij_status_idx").on(table.status),
    ]
);

export const importJobParagraphs = sqliteTable(
    "import_job_paragraphs",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        jobId: text("job_id")
            .notNull()
            .references(() => importJobs.id, { onDelete: "cascade" }),
        pageNumber: integer("page_number").notNull(),
        paragraphIndex: integer("paragraph_index").notNull(),
        rawText: text("raw_text").notNull(),
        cleanedText: text("cleaned_text"),
        cleanStatus: text("clean_status", { enum: IMPORT_PARA_CLEAN_STATUSES })
            .notNull()
            .default("pending"),
        lastError: text("last_error"),
        isDeleted: integer("is_deleted").notNull().default(0),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("ijp_job_idx").on(table.jobId),
        index("ijp_clean_status_idx").on(table.cleanStatus),
        index("ijp_job_order_idx").on(table.jobId, table.pageNumber, table.paragraphIndex),
    ]
);

export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;
export type ImportJobParagraph = typeof importJobParagraphs.$inferSelect;
export type NewImportJobParagraph = typeof importJobParagraphs.$inferInsert;
