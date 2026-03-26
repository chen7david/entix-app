import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { 
    bulkMemberItemSchema, 
    bulkMetricsSchema, 
    bulkImportResponseSchema 
} from "@shared/schemas/dto/bulk-member.dto";

export class BulkMemberRoutes {
    static tags = ["Organization Members"];

    static getMetrics = createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/bulk/metrics",
        middleware: [requirePermission("organization", ["update"])] as const,
        request: {
            params: z.object({ organizationId: z.string() })
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(bulkMetricsSchema, "Organization dashboard metrics"),
        },
        tags: BulkMemberRoutes.tags,
    });

    static exportMembers = createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/bulk/export",
        middleware: [requirePermission("member", ["bulk-export"])] as const,
        request: {
            params: z.object({ organizationId: z.string() })
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.array(bulkMemberItemSchema), "Exported member data"),
        },
        tags: BulkMemberRoutes.tags,
    });

    static importMembers = createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/bulk/import",
        middleware: [requirePermission("member", ["bulk-import"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: {
                content: { "application/json": { schema: z.array(bulkMemberItemSchema) } }
            }
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(bulkImportResponseSchema, "Import summary results"),
        },
        tags: BulkMemberRoutes.tags,
    });
}
