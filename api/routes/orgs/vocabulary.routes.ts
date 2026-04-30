import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";

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
    orgId: z.string(),
    attendanceId: z.string(),
    createdAt: z.coerce.number(),
    vocabulary: VocabularyBankSchema,
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
                            text: z.string().min(1),
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
                            vocabulary: VocabularyBankSchema,
                            assignedCount: z.number().int().nonnegative(),
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
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.array(VocabularyBankSchema) } },
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
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": { schema: z.array(StudentVocabularyWithVocabSchema) },
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
                            id: z.string(),
                            userId: z.string(),
                            orgId: z.string(),
                            vocabularyId: z.string(),
                            attendanceId: z.string(),
                            createdAt: z.coerce.number(),
                        }),
                    },
                },
                description: "Vocabulary assigned to student attendance",
            },
        },
    }),
};
