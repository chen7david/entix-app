export const IMPORT_JOB_STATUSES = [
    "uploading",
    "ocr",
    "review",
    "finalizing",
    "done",
    "failed",
] as const;
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

export const IMPORT_PARA_CLEAN_STATUSES = [
    "pending",
    "cleaning",
    "done",
    "skipped",
    "failed",
] as const;
export type ImportParaCleanStatus = (typeof IMPORT_PARA_CLEAN_STATUSES)[number];

export const IMPORT_FILE_TYPES = ["pdf", "epub", "image"] as const;
export type ImportFileType = (typeof IMPORT_FILE_TYPES)[number];

/**
 * D1/SQLite allows ~999 bound params per statement. Drizzle bulk-insert for
 * `import_job_paragraphs` binds more than the 5 user-provided columns (id default,
 * timestamps, etc.) — keep chunks small (see tests/integration/import-job.integration.test.ts).
 */
export const IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE = 20;
