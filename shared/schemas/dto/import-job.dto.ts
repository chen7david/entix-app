import { z } from "zod";
import {
    IMPORT_FILE_TYPES,
    IMPORT_JOB_STATUSES,
    IMPORT_PARA_CLEAN_STATUSES,
} from "../../constants/import";
import { TextCollectionDtoSchema } from "./passage.dto";

export const CreateImportJobSchema = z.object({
    fileName: z.string().min(1).max(255),
    fileType: z.enum(IMPORT_FILE_TYPES),
    bucketKey: z.string().optional(),
});
export type CreateImportJobInput = z.infer<typeof CreateImportJobSchema>;

export const UpdateImportJobSchema = z.object({
    status: z.enum(IMPORT_JOB_STATUSES).optional(),
    collectionId: z.string().nullable().optional(),
    bucketKey: z.string().nullable().optional(),
    totalParagraphs: z.number().int().positive().optional(),
});
export type UpdateImportJobInput = z.infer<typeof UpdateImportJobSchema>;

export const ImportParagraphItemSchema = z.object({
    pageNumber: z.number().int().min(0),
    paragraphIndex: z.number().int().min(0),
    rawText: z.string().min(1),
});
export type ImportParagraphItem = z.infer<typeof ImportParagraphItemSchema>;

export const BulkInsertParagraphsSchema = z.object({
    paragraphs: z.array(ImportParagraphItemSchema).min(1).max(500),
});
export type BulkInsertParagraphsInput = z.infer<typeof BulkInsertParagraphsSchema>;

export const UpdateImportParagraphSchema = z.object({
    cleanedText: z.string().min(1).optional(),
    cleanStatus: z.enum(IMPORT_PARA_CLEAN_STATUSES).optional(),
    isDeleted: z.number().int().min(0).max(1).optional(),
});
export type UpdateImportParagraphInput = z.infer<typeof UpdateImportParagraphSchema>;

export const FinalizeImportSchema = z.object({
    title: z.string().min(1).max(255),
    author: z.string().optional(),
    description: z.string().max(2000).optional(),
    cefrLevel: z.string().optional(),
    mode: z.enum(["single", "per_paragraph"]).default("single"),
});
export type FinalizeImportInput = z.infer<typeof FinalizeImportSchema>;

export const ImportJobParagraphDtoSchema = z.object({
    id: z.string(),
    jobId: z.string(),
    pageNumber: z.number(),
    paragraphIndex: z.number(),
    rawText: z.string(),
    cleanedText: z.string().nullable(),
    cleanStatus: z.enum(IMPORT_PARA_CLEAN_STATUSES),
    lastError: z.string().nullable(),
    isDeleted: z.number(),
    createdAt: z.coerce.number(),
    updatedAt: z.coerce.number(),
});
export type ImportJobParagraphDto = z.infer<typeof ImportJobParagraphDtoSchema>;

export const ImportJobDtoSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    collectionId: z.string().nullable(),
    status: z.enum(IMPORT_JOB_STATUSES),
    fileName: z.string(),
    fileType: z.enum(IMPORT_FILE_TYPES),
    bucketKey: z.string().nullable(),
    totalParagraphs: z.number().nullable(),
    createdBy: z.string(),
    createdAt: z.coerce.number(),
    updatedAt: z.coerce.number(),
    paragraphs: z.array(ImportJobParagraphDtoSchema).optional(),
});
export type ImportJobDto = z.infer<typeof ImportJobDtoSchema>;

export const FinalizeImportResponseSchema = z.object({
    data: TextCollectionDtoSchema,
});
