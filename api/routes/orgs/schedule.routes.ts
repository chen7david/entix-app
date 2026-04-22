import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requireOrgMembership } from "@api/middleware/org-membership.middleware";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    createPaginatedResponseSchema,
    PaginationQuerySchema,
} from "@shared/schemas/pagination.schema";

const SessionResponseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    teacherUserId: z.string().nullable().optional(),
    startTime: z.coerce.number(), // UTC ms
    durationMinutes: z.number(),
    status: z.enum(["scheduled", "completed", "cancelled"]),
    seriesId: z.string().nullable(),
    recurrenceRule: z.string().nullable(),
    participants: z
        .array(
            z.object({
                sessionId: z.string(),
                memberId: z.string(),
                joinedAt: z.coerce.number().optional(),
                absent: z.boolean().optional().default(false),
                absenceReason: z.string().nullable().optional(),
                notes: z.string().nullable().optional(),
                member: z
                    .object({
                        user: z
                            .object({
                                id: z.string(),
                                name: z.string(),
                                email: z.string(),
                                image: z.string().nullable(),
                            })
                            .optional(),
                    })
                    .optional(),
            })
        )
        .optional(),
});
const MeetingRouteMiddleware = [requireOrgMembership];

export const ScheduleRoutes = {
    listSessions: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule",
        tags: ["Schedule"],
        middleware: [requirePermission("schedule", ["read"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: z
                .object({
                    startDate: z.coerce.number().optional(),
                    endDate: z.coerce.number().optional(),
                    tzOffset: z.string().optional(),
                })
                .merge(PaginationQuerySchema),
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
        middleware: [requirePermission("schedule", ["read"])] as const,
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
        middleware: [requirePermission("schedule", ["read"])] as const,
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
                        schema: z.array(
                            z.object({
                                date: z.string(),
                                total: z.number(),
                                scheduled: z.number(),
                                completed: z.number(),
                                cancelled: z.number(),
                            })
                        ),
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
        middleware: [requirePermission("schedule", ["read"])] as const,
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
                        schema: z.array(
                            z.object({
                                date: z.string(),
                                totalExpected: z.number(),
                                present: z.number(),
                                absent: z.number(),
                            })
                        ),
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
        middleware: [requirePermission("schedule", ["create"])] as const,
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
                            teacherUserId: z.string().min(1),
                            startTime: z.number(),
                            durationMinutes: z.number().min(15),
                            userIds: z.array(z.string()),
                            recurrence: z
                                .object({
                                    frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
                                    count: z.number().min(2).max(52),
                                })
                                .optional(),
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
        middleware: [requirePermission("schedule", ["update"])] as const,
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
                            teacherUserId: z.string().min(1),
                            startTime: z.number(),
                            durationMinutes: z.number().min(15),
                            userIds: z.array(z.string()),
                            updateForward: z.boolean().default(false),
                            status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
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
        middleware: [requirePermission("schedule", ["update"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.enum(["scheduled", "completed", "cancelled"]),
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
        middleware: [requirePermission("schedule", ["update"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            attendances: z.array(
                                z.object({
                                    userId: z.string(),
                                    absent: z.boolean(),
                                    absenceReason: z.string().nullable().optional(),
                                    notes: z.string().nullable().optional(),
                                })
                            ),
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

    issueSessionMeetingToken: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/token",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                token: z.string(),
                                role: z.enum(["organizer", "participant"]),
                                meetingId: z.string(),
                                appId: z.string(),
                                sessionId: z.string(),
                            }),
                        }),
                    },
                },
                description: "Short-lived Realtime Kit join token for this session",
            },
        },
    }),

    requestSessionMeetingAdmission: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/waiting-room/request",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                status: z.enum(["pending", "approved", "denied"]),
                                role: z.enum(["organizer", "participant"]),
                            }),
                        }),
                    },
                },
                description: "Create or return waiting room admission request",
            },
        },
    }),

    getSessionMeetingAdmissionStatus: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/waiting-room/status",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                status: z.enum(["not_requested", "pending", "approved", "denied"]),
                                role: z.enum(["organizer", "participant"]),
                            }),
                        }),
                    },
                },
                description: "Current waiting-room status for this user",
            },
        },
    }),

    listSessionMeetingPendingAdmissions: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/waiting-room/pending",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                items: z.array(
                                    z.object({
                                        userId: z.string(),
                                        status: z.enum(["pending", "approved", "denied"]),
                                        role: z.enum(["participant", "organizer"]),
                                        requestedAt: z.number(),
                                        displayName: z.string().nullable().optional(),
                                        email: z.string().nullable().optional(),
                                        image: z.string().nullable().optional(),
                                    })
                                ),
                            }),
                        }),
                    },
                },
                description: "Waiting-room queue visible to organizers",
            },
        },
    }),

    approveSessionMeetingAdmission: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/waiting-room/{targetUserId}/approve",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                status: z.enum(["approved", "denied"]),
                            }),
                        }),
                    },
                },
                description: "Approve a waiting-room participant",
            },
        },
    }),

    denySessionMeetingAdmission: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/waiting-room/{targetUserId}/deny",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                status: z.enum(["approved", "denied"]),
                            }),
                        }),
                    },
                },
                description: "Deny a waiting-room participant",
            },
        },
    }),

    listSessionMeetingParticipants: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                items: z.array(
                                    z.object({
                                        userId: z.string(),
                                        participantId: z.string(),
                                        name: z.string().nullable().optional(),
                                        image: z.string().nullable().optional(),
                                        isOrganizer: z.boolean(),
                                        forceMuted: z.boolean(),
                                    })
                                ),
                            }),
                        }),
                    },
                },
                description: "Meeting participant roster for organizers",
            },
        },
    }),

    getSessionMeetingMuteStatus: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/self/mute-status",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                forceMuted: z.boolean(),
                            }),
                        }),
                    },
                },
                description: "Current user's forced-mute status",
            },
        },
    }),

    getSessionMeetingVideoStatus: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/self/video-status",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                forceVideoOff: z.boolean(),
                            }),
                        }),
                    },
                },
                description: "Current user's forced-video-off status",
            },
        },
    }),

    muteSessionMeetingParticipant: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/{targetUserId}/mute",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                forceMuted: z.boolean(),
                            }),
                        }),
                    },
                },
                description: "Force-mute participant",
            },
        },
    }),

    unmuteSessionMeetingParticipant: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/{targetUserId}/unmute",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                forceMuted: z.boolean(),
                            }),
                        }),
                    },
                },
                description: "Clear force-mute participant flag",
            },
        },
    }),

    removeSessionMeetingParticipant: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/{targetUserId}/remove",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                removed: z.boolean(),
                                userId: z.string(),
                            }),
                        }),
                    },
                },
                description: "Remove participant from current meeting",
            },
        },
    }),

    stopSessionMeetingParticipantVideo: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/{targetUserId}/video-off",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                forceVideoOff: z.boolean(),
                            }),
                        }),
                    },
                },
                description: "Force-stop participant video",
            },
        },
    }),

    allowSessionMeetingParticipantVideo: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/{targetUserId}/video-on",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                forceVideoOff: z.boolean(),
                            }),
                        }),
                    },
                },
                description: "Allow participant video again",
            },
        },
    }),

    getSessionMeetingRoomStatus: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/room",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: { params: z.object({ organizationId: z.string(), sessionId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                locked: z.boolean(),
                                participantCount: z.number(),
                                maxParticipants: z.number(),
                            }),
                        }),
                    },
                },
                description: "Meeting room lock and capacity status",
            },
        },
    }),

    lockSessionMeetingRoom: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/room/lock",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: { params: z.object({ organizationId: z.string(), sessionId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({ data: z.object({ locked: z.boolean() }) }),
                    },
                },
                description: "Lock meeting room",
            },
        },
    }),

    unlockSessionMeetingRoom: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/room/unlock",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: { params: z.object({ organizationId: z.string(), sessionId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({ data: z.object({ locked: z.boolean() }) }),
                    },
                },
                description: "Unlock meeting room",
            },
        },
    }),

    requestSessionMeetingUnmute: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/self/unmute-request",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: { params: z.object({ organizationId: z.string(), sessionId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                status: z.enum(["pending", "approved", "denied"]),
                                requestedAt: z.number(),
                            }),
                        }),
                    },
                },
                description: "Participant requests host approval to unmute",
            },
        },
    }),

    getSessionMeetingUnmuteRequestStatus: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/participants/self/unmute-request/status",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: { params: z.object({ organizationId: z.string(), sessionId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                status: z.enum(["none", "pending", "approved", "denied"]),
                            }),
                        }),
                    },
                },
                description: "Current participant unmute-request status",
            },
        },
    }),

    listSessionMeetingUnmuteRequests: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/unmute-requests",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: { params: z.object({ organizationId: z.string(), sessionId: z.string() }) },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                items: z.array(
                                    z.object({
                                        userId: z.string(),
                                        status: z.enum(["pending"]),
                                        requestedAt: z.number(),
                                    })
                                ),
                            }),
                        }),
                    },
                },
                description: "Organizer view of pending unmute requests",
            },
        },
    }),

    approveSessionMeetingUnmuteRequest: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/unmute-requests/{targetUserId}/approve",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                status: z.enum(["approved", "denied"]),
                            }),
                        }),
                    },
                },
                description: "Approve participant unmute request",
            },
        },
    }),

    denySessionMeetingUnmuteRequest: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/schedule/{sessionId}/meeting/unmute-requests/{targetUserId}/deny",
        tags: ["Schedule"],
        middleware: MeetingRouteMiddleware,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                targetUserId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: z.object({
                                userId: z.string(),
                                status: z.enum(["approved", "denied"]),
                            }),
                        }),
                    },
                },
                description: "Deny participant unmute request",
            },
        },
    }),

    deleteSession: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/schedule/{sessionId}",
        tags: ["Schedule"],
        middleware: [requirePermission("schedule", ["delete"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            deleteForward: z.boolean().default(false),
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
