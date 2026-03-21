import { createRoute, z } from "@hono/zod-openapi";
import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireOrgMembership } from "@api/middleware/org-membership.middleware";
import { PaginationQuerySchema, createPaginatedResponseSchema } from "@shared/schemas/pagination.schema";

const SessionResponseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    startTime: z.coerce.number(), // UTC ms
    durationMinutes: z.number(),
    status: z.enum(["scheduled", "completed", "cancelled"]),
    seriesId: z.string().nullable(),
    recurrenceRule: z.string().nullable(),
    participants: z.array(z.object({
        sessionId: z.string(),
        memberId: z.string(),
        joinedAt: z.coerce.number().optional(),
        absent: z.boolean().optional().default(false),
        absenceReason: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        member: z.object({
            user: z.object({
                id: z.string(),
                name: z.string(),
                email: z.string(),
                image: z.string().nullable()
            }).optional()
        }).optional()
    })).optional()
});

export const ScheduleRoutes = {
    listSessions: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule",
        tags: ["Schedule"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: z.object({
                startDate: z.coerce.number().optional(),
                endDate: z.coerce.number().optional(),
                tzOffset: z.string().optional(),
            }).merge(PaginationQuerySchema),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: createPaginatedResponseSchema(SessionResponseSchema),
                    },
                },
                description: "List of scheduled sessions",
            },
        },
    }),

    getScheduleMetrics: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/metrics",
        tags: ["Schedule"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: z.object({
                startDate: z.coerce.number().optional(),
                endDate: z.coerce.number().optional(),
                tzOffset: z.string().optional(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            total: z.number(),
                            completed: z.number(),
                            cancelled: z.number(),
                        }),
                    },
                },
                description: "Aggregate summary of scheduled sessions across date boundaries",
            },
        },
    }),

    getAnalyticsSessions: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/analytics/sessions",
        tags: ["Schedule", "Analytics"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: z.object({
                startDate: z.coerce.number().optional(),
                endDate: z.coerce.number().optional(),
                tzOffset: z.string().optional(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(z.object({
                            date: z.string(),
                            total: z.number(),
                            scheduled: z.number(),
                            completed: z.number(),
                            cancelled: z.number(),
                        })),
                    },
                },
                description: "Daily aggregates of scheduled sessions",
            },
        },
    }),

    getAnalyticsAttendance: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/analytics/attendance",
        tags: ["Schedule", "Analytics"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: z.object({
                startDate: z.coerce.number().optional(),
                endDate: z.coerce.number().optional(),
                tzOffset: z.string().optional(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(z.object({
                            date: z.string(),
                            totalExpected: z.number(),
                            present: z.number(),
                            absent: z.number(),
                        })),
                    },
                },
                description: "Daily aggregates of session attendance",
            },
        },
    }),

    createSession: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule",
        tags: ["Schedule"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string().min(1),
                            description: z.string().nullable().optional(),
                            startTime: z.number(),
                            durationMinutes: z.number().min(15),
                            userIds: z.array(z.string()),
                            recurrence: z.object({
                                frequency: z.literal("weekly"),
                                count: z.number().min(2).max(52)
                            }).optional()
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: z.array(SessionResponseSchema) } },
                description: "Sessions created securely",
            },
        },
    }),

    updateSession: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/schedule/{sessionId}",
        tags: ["Schedule"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string().min(1),
                            description: z.string().nullable().optional(),
                            startTime: z.number(),
                            durationMinutes: z.number().min(15),
                            userIds: z.array(z.string()),
                            updateForward: z.boolean().default(false),
                            status: z.enum(["scheduled", "completed", "cancelled"]).optional()
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
                description: "Session(s) mutated securely",
            },
        },
    }),

    updateSessionStatus: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/schedule/{sessionId}/status",
        tags: ["Schedule"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.enum(["scheduled", "completed", "cancelled"])
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
                description: "Session status updated",
            },
        },
    }),

    updateAttendance: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/schedule/{sessionId}/attendances",
        tags: ["Schedule"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            attendances: z.array(z.object({
                                userId: z.string(),
                                absent: z.boolean(),
                                absenceReason: z.string().nullable().optional(),
                                notes: z.string().nullable().optional(),
                            }))
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
                description: "Attendance metrics mutated securely",
            },
        },
    }),

    deleteSession: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/schedule/{sessionId}",
        tags: ["Schedule"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            deleteForward: z.boolean().default(false)
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
                description: "Session(s) deleted securely",
            },
        },
    }),
};
