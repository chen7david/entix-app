import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import { PaginationQuerySchema } from "@shared/schemas/pagination.schema";

const VocabularyBankSchema = z.object({
    id: z.string(),
    text: z.string(),
    zhTranslation: z.string().nullable(),
    pinyin: z.string().nullable(),
    enAudioUrl: z.string().nullable(),
    zhAudioUrl: z.string().nullable(),
    status: z.enum([
        "new",
        "processing_text",
        "text_ready",
        "processing_audio",
        "active",
        "review",
    ]),
    createdAt: z.coerce.number(),
    updatedAt: z.coerce.number(),
});

const StudentVocabularyWithVocabSchema = z.object({
    id: z.string(),
    userId: z.string(),
    organizationId: z.string(),
    attendanceId: z.string(),
    createdAt: z.coerce.number(),
    vocabulary: VocabularyBankSchema,
});

const PaginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        data: z.array(itemSchema),
        nextCursor: z.string().nullable(),
        prevCursor: z.string().nullable(),
    });

export const VocabularyRoutes = {
    createVocabulary: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/vocabulary",
        tags: ["Vocabulary"],
        middleware: [requirePermission("vocabulary", ["create"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            text: z.string().trim().min(1, "Vocabulary text cannot be blank"),
                            sessionId: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                vocabulary: VocabularyBankSchema,
                                targetCount: z.number().int().nonnegative(),
                            }),
                        }),
                    },
                },
                description: "Vocabulary bank item created or reused",
            },
        },
    }),
    listReviewVocabulary: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/vocabulary/review",
        tags: ["Vocabulary"],
        middleware: [requirePermission("vocabulary", ["read"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            query: PaginationQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: PaginatedDataSchema(VocabularyBankSchema),
                    },
                },
                description: "List review vocabulary items",
            },
        },
    }),
    listSessionVocabulary: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/sessions/{sessionId}/vocabulary",
        tags: ["Vocabulary"],
        middleware: [requirePermission("vocabulary", ["read"])] as const,
        request: {
            params: z.object({ organizationId: z.string(), sessionId: z.string() }),
            query: PaginationQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: PaginatedDataSchema(StudentVocabularyWithVocabSchema),
                    },
                },
                description: "List vocabulary assigned in a session",
            },
        },
    }),
    assignVocabularyToStudent: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/sessions/{sessionId}/vocabulary/{vocabId}/assign",
        tags: ["Vocabulary"],
        middleware: [requirePermission("vocabulary", ["create"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                vocabId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            userId: z.string(),
                            attendanceId: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                id: z.string(),
                                userId: z.string(),
                                organizationId: z.string(),
                                vocabularyId: z.string(),
                                attendanceId: z.string(),
                                createdAt: z.coerce.number(),
                            }),
                        }),
                    },
                },
                description: "Vocabulary assigned to student attendance",
            },
        },
    }),
    removeSessionVocabulary: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/sessions/{sessionId}/vocabulary/{studentVocabId}",
        tags: ["Vocabulary"],
        middleware: [requirePermission("vocabulary", ["delete"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                studentVocabId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Vocabulary removed from session wordlist",
            },
        },
    }),
    removeVocabularyFromSession: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/sessions/{sessionId}/vocabulary/bank/{vocabId}",
        tags: ["Vocabulary"],
        middleware: [requirePermission("vocabulary", ["delete"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                vocabId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Vocabulary removed from all students in this session",
            },
        },
    }),
};
