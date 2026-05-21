import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    bulkImportRequestSchema,
    bulkImportResponseSchema,
    bulkMemberItemSchema,
    bulkMetricsSchema,
} from "@shared/schemas/dto/bulk-member.dto";

const tags = ["Organization Members"];

export const BulkMemberRoutes = {
    tags,

    getMetrics: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/bulk/metrics",
        middleware: [requirePermission("dashboard", ["read"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(bulkMetricsSchema, "Organization dashboard metrics"),
        },
        tags: tags,
    }),

    exportMembers: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/bulk/export",
        middleware: [requirePermission("member", ["bulk-export"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.array(bulkMemberItemSchema),
                "Exported member data"
            ),
        },
        tags: tags,
    }),

    importMembers: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/bulk/import",
        middleware: [requirePermission("member", ["bulk-import"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContent(bulkImportRequestSchema, "Bulk import payload"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(bulkImportResponseSchema, "Import summary results"),
        },
        tags: tags,
    }),
};
