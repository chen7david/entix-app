import {
    getDashboardService,
    getMemberExportService,
    getMemberImportService,
} from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { BulkMemberRoutes } from "./bulk-member.routes";

export class BulkMemberHandler {
    static getMetrics: AppHandler<typeof BulkMemberRoutes.getMetrics> = async (ctx) => {
        const organizationId = ctx.req.valid("param").organizationId;
        const metrics = await getDashboardService(ctx).getDashboardMetrics(organizationId);
        return ctx.json(metrics, HttpStatusCodes.OK);
    };

    static exportMembers: AppHandler<typeof BulkMemberRoutes.exportMembers> = async (ctx) => {
        const organizationId = ctx.req.valid("param").organizationId;
        const data = await getMemberExportService(ctx).exportMembers(organizationId);
        return ctx.json(data, HttpStatusCodes.OK);
    };

    static importMembers: AppHandler<typeof BulkMemberRoutes.importMembers> = async (ctx) => {
        const organizationId = ctx.req.valid("param").organizationId;
        const payload = ctx.req.valid("json");
        const results = await getMemberImportService(ctx).importMembers(
            organizationId,
            payload.members,
            payload.importOptions
        );
        return ctx.json(results, HttpStatusCodes.OK);
    };
}
