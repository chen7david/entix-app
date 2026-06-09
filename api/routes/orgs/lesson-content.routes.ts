import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import { PASSAGE_TYPES } from "@shared/db/schema/passages.schema";

const LessonParamsSchema = z.object({ organizationId: z.string(), lessonId: z.string() });

const ObjectiveSchema = z.object({
    id: z.string(),
    lessonId: z.string(),
    objective: z.string(),
    position: z.number(),
    createdAt: z.coerce.number(),
    updatedAt: z.coerce.number(),
});

const LessonPlaylistRowSchema = z.object({
    lessonId: z.string(),
    playlistId: z.string(),
    position: z.number(),
    addedAt: z.coerce.number(),
});

const LessonVocabRowSchema = z.object({
    lessonId: z.string(),
    vocabularyId: z.string(),
    position: z.number(),
    addedAt: z.coerce.number(),
});

export const LessonPassageRowSchema = z.object({
    lessonId: z.string(),
    passageId: z.string(),
    position: z.number(),
    addedAt: z.number(),
    title: z.string().nullable(),
    type: z.enum(PASSAGE_TYPES),
    cefrLevel: z.string().nullable(),
    wordCount: z.number().nullable(),
});

export type LessonPassageRowDto = z.infer<typeof LessonPassageRowSchema>;

export const LessonContentRoutes = {
    listObjectives: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/lessons/{lessonId}/objectives",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["read"])] as const,
        request: { params: LessonParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.array(ObjectiveSchema) } },
                description: "List lesson objectives",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    replaceObjectives: createRoute({
        method: HttpMethods.PUT,
        path: "/orgs/{organizationId}/lessons/{lessonId}/objectives",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            objectives: z.array(z.string().trim().min(1)).max(50),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.array(ObjectiveSchema) } },
                description: "Objectives replaced",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    reorderObjectives: createRoute({
        method: HttpMethods.PUT,
        path: "/orgs/{organizationId}/lessons/{lessonId}/objectives/reorder",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            orderedIds: z.array(z.string()).min(1),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.array(ObjectiveSchema) } },
                description: "Objectives reordered",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),

    listLessonPlaylists: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/lessons/{lessonId}/playlists",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["read"])] as const,
        request: { params: LessonParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(LessonPlaylistRowSchema),
                    },
                },
                description: "List lesson playlists",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    addLessonPlaylist: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/lessons/{lessonId}/playlists",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            playlistId: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: LessonPlaylistRowSchema } },
                description: "Playlist added to lesson",
            },
            [HttpStatusCodes.CONFLICT]: jsonContent(
                z.object({ message: z.string() }),
                "Playlist already linked to this lesson"
            ),
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    reorderLessonPlaylists: createRoute({
        method: HttpMethods.PUT,
        path: "/orgs/{organizationId}/lessons/{lessonId}/playlists/reorder",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            orderedIds: z.array(z.string()).min(1),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(LessonPlaylistRowSchema),
                    },
                },
                description: "Playlists reordered",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    removeLessonPlaylist: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/lessons/{lessonId}/playlists/{playlistId}",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema.extend({ playlistId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Playlist removed from lesson" },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Playlist not linked to this lesson"
            ),
        },
    }),

    listLessonVocabulary: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/lessons/{lessonId}/vocabulary",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["read"])] as const,
        request: { params: LessonParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(LessonVocabRowSchema),
                    },
                },
                description: "List lesson vocabulary",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    addLessonVocabulary: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/lessons/{lessonId}/vocabulary",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            vocabularyId: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: LessonVocabRowSchema } },
                description: "Vocabulary word added to lesson",
            },
            [HttpStatusCodes.CONFLICT]: jsonContent(
                z.object({ message: z.string() }),
                "Vocabulary item already linked to this lesson"
            ),
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    reorderLessonVocabulary: createRoute({
        method: HttpMethods.PUT,
        path: "/orgs/{organizationId}/lessons/{lessonId}/vocabulary/reorder",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            orderedIds: z.array(z.string()).min(1),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(LessonVocabRowSchema),
                    },
                },
                description: "Vocabulary reordered",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    removeLessonVocabulary: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/lessons/{lessonId}/vocabulary/{vocabularyId}",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema.extend({ vocabularyId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Vocabulary word removed from lesson" },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Vocabulary word not linked to this lesson"
            ),
        },
    }),

    listLessonPassages: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/lessons/{lessonId}/passages",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["read"])] as const,
        request: { params: LessonParamsSchema },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(LessonPassageRowSchema),
                    },
                },
                description: "List lesson passages",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    addLessonPassage: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/lessons/{lessonId}/passages",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            passageId: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: LessonPassageRowSchema } },
                description: "Passage added to lesson",
            },
            [HttpStatusCodes.CONFLICT]: jsonContent(
                z.object({ message: z.string() }),
                "Passage already linked to this lesson"
            ),
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson or passage not found"
            ),
        },
    }),
    reorderLessonPassages: createRoute({
        method: HttpMethods.PUT,
        path: "/orgs/{organizationId}/lessons/{lessonId}/passages/reorder",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema,
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            orderedIds: z.array(z.string()).min(1),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(LessonPassageRowSchema),
                    },
                },
                description: "Passages reordered",
            },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Lesson not found"
            ),
        },
    }),
    removeLessonPassage: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/lessons/{lessonId}/passages/{passageId}",
        tags: ["Lesson Content"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: LessonParamsSchema.extend({ passageId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Passage removed from lesson" },
            [HttpStatusCodes.NOT_FOUND]: jsonContent(
                z.object({ message: z.string() }),
                "Passage not linked to this lesson"
            ),
        },
    }),
};
