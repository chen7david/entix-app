import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute } from "@hono/zod-openapi";
import { auditLogQuerySchema, paginatedAuditResponseSchema } from "@shared/schemas/dto/audit.dto";
import { z } from "zod";

const tags = ["Admin - Audit Logs"];

export const AdminAuditRoutes = {
    tags,

    list: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/admin/audit-logs",
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            query: auditLogQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                paginatedAuditResponseSchema,
                "List of system audit events"
            ),
        },
    }),

    acknowledge: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/admin/audit-logs/{id}/acknowledge",
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            params: z.object({
                id: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({ success: z.boolean() }),
                "Success response"
            ),
        },
    }),
};
