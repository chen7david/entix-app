import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";

const LessonSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    createdAt: z.coerce.number(),
    updatedAt: z.coerce.number(),
});

export const LessonRoutes = {
    listLessons: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/lessons",
        tags: ["Lessons"],
        middleware: [requirePermission("lesson", ["read"])] as const,
        request: { params: z.object({ organizationId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.array(LessonSchema) } },
                description: "List lessons",
            },
        },
    }),
    createLesson: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/lessons",
        tags: ["Lessons"],
        middleware: [requirePermission("lesson", ["create"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string().min(1),
                            description: z.string().nullable().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: LessonSchema } },
                description: "Lesson created",
            },
        },
    }),
    getLesson: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/lessons/{lessonId}",
        tags: ["Lessons"],
        middleware: [requirePermission("lesson", ["read"])] as const,
        request: {
            params: z.object({ organizationId: z.string(), lessonId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: LessonSchema } },
                description: "Lesson details",
            },
        },
    }),
    updateLesson: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/lessons/{lessonId}",
        tags: ["Lessons"],
        middleware: [requirePermission("lesson", ["update"])] as const,
        request: {
            params: z.object({ organizationId: z.string(), lessonId: z.string() }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string().min(1).optional(),
                            description: z.string().nullable().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: LessonSchema } },
                description: "Lesson updated",
            },
        },
    }),
    deleteLesson: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/lessons/{lessonId}",
        tags: ["Lessons"],
        middleware: [requirePermission("lesson", ["delete"])] as const,
        request: {
            params: z.object({ organizationId: z.string(), lessonId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: { description: "Lesson deleted" },
        },
    }),
};
