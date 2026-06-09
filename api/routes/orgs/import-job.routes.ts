import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    BulkInsertParagraphsSchema,
    CreateImportJobSchema,
    FinalizeImportSchema,
    ImportJobDtoSchema,
    ImportJobParagraphDtoSchema,
    UpdateImportJobSchema,
    UpdateImportParagraphSchema,
} from "@shared/schemas/dto/import-job.dto";
import { TextCollectionDtoSchema } from "@shared/schemas/dto/passage.dto";

const OrgParamsSchema = z.object({ organizationId: z.string() });
const JobParamsSchema = OrgParamsSchema.extend({ jobId: z.string() });
const ParagraphParamsSchema = JobParamsSchema.extend({ paragraphId: z.string() });

const NotFoundResponse = jsonContent(z.object({ message: z.string() }), "Not found");

const ImportJobListSchema = z.object({ data: z.array(ImportJobDtoSchema) });
const ImportJobDetailSchema = z.object({
    data: ImportJobDtoSchema.extend({
        paragraphs: z.array(ImportJobParagraphDtoSchema),
    }),
});

export const ImportJobRoutes = {
    listJobs: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/imports",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["read"])] as const,
        request: { params: OrgParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: ImportJobListSchema } },
                description: "List import jobs",
            },
        },
    }),
    createJob: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/imports",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["create"])] as const,
        request: {
            params: OrgParamsSchema,
            body: { content: { "application/json": { schema: CreateImportJobSchema } } },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: z.object({ data: ImportJobDtoSchema }) } },
                description: "Import job created",
            },
        },
    }),
    getJob: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/imports/{jobId}",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["read"])] as const,
        request: { params: JobParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: ImportJobDetailSchema } },
                description: "Import job with paragraphs",
            },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    updateJob: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/imports/{jobId}",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["update"])] as const,
        request: {
            params: JobParamsSchema,
            body: { content: { "application/json": { schema: UpdateImportJobSchema } } },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.object({ data: ImportJobDtoSchema }) } },
                description: "Import job updated",
            },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    deleteJob: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/imports/{jobId}",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["delete"])] as const,
        request: { params: JobParamsSchema },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Import job deleted" },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    bulkInsertParagraphs: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/imports/{jobId}/paragraphs",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["update"])] as const,
        request: {
            params: JobParamsSchema,
            body: { content: { "application/json": { schema: BulkInsertParagraphsSchema } } },
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Paragraphs inserted" },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    updateParagraph: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/imports/{jobId}/paragraphs/{paragraphId}",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["update"])] as const,
        request: {
            params: ParagraphParamsSchema,
            body: { content: { "application/json": { schema: UpdateImportParagraphSchema } } },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": { schema: z.object({ data: ImportJobParagraphDtoSchema }) },
                },
                description: "Paragraph updated",
            },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    deleteParagraph: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/imports/{jobId}/paragraphs/{paragraphId}",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["delete"])] as const,
        request: { params: ParagraphParamsSchema },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Paragraph deleted" },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
    finalizeJob: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/imports/{jobId}/finalize",
        tags: ["Book Import"],
        middleware: [requirePermission("passage", ["create"])] as const,
        request: {
            params: JobParamsSchema,
            body: { content: { "application/json": { schema: FinalizeImportSchema } } },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: z.object({ data: TextCollectionDtoSchema }) } },
                description: "Import finalized as text collection",
            },
            [HttpStatusCodes.NOT_FOUND]: NotFoundResponse,
        },
    }),
};
