import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";

const EnrollmentSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    organizationId: z.string(),
    userId: z.string(),
    joinedAt: z.coerce.number(),
    absent: z.boolean(),
    absenceReason: z.string().nullable(),
    notes: z.string().nullable(),
    paymentStatus: z.string(),
});

const StudentDashboardSchema = z.object({
    sessionId: z.string(),
    lessonTitle: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    teacherName: z.string(),
    sessionStatus: z.enum(["scheduled", "completed", "cancelled"]),
    enrollmentStatus: z.string(),
});

export const EnrollmentRoutes = {
    createEnrollment: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/sessions/{sessionId}/enrollments",
        tags: ["Enrollments"],
        middleware: [requirePermission("enrollment", ["create"])] as const,
        request: {
            params: z.object({ organizationId: z.string(), sessionId: z.string() }),
            body: {
                content: {
                    "application/json": {
                        schema: z
                            .object({
                                userId: z.string().optional(),
                            })
                            .optional(),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: { "application/json": { schema: EnrollmentSchema } },
                description: "Enrollment created",
            },
        },
    }),
    deleteEnrollment: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/sessions/{sessionId}/enrollments/{enrollmentId}",
        tags: ["Enrollments"],
        middleware: [requirePermission("enrollment", ["delete"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                sessionId: z.string(),
                enrollmentId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Enrollment deleted",
            },
        },
    }),
    getMyEnrollments: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/enrollments/me",
        tags: ["Enrollments"],
        middleware: [requirePermission("enrollment", ["read"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: { "application/json": { schema: z.array(StudentDashboardSchema) } },
                description: "My enrollment dashboard",
            },
        },
    }),
};
