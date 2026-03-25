import { AppHandler } from "@api/helpers/types.helpers";
import { getBulkMemberService } from "@api/factories/service.factory";
import { BulkMemberRoutes } from "./bulk-member.routes";
import { HttpStatusCodes } from "@api/helpers/http.helpers";

export class BulkMemberHandler {
    static getMetrics: AppHandler<typeof BulkMemberRoutes.getMetrics> = async (ctx) => {
        const organizationId = ctx.get("organizationId")!;
        const service = getBulkMemberService(ctx);
        const metrics = await service.getDashboardMetrics(organizationId);
        return ctx.json(metrics, HttpStatusCodes.OK);
    };

    static exportMembers: AppHandler<typeof BulkMemberRoutes.exportMembers> = async (ctx) => {
        const organizationId = ctx.get("organizationId")!;
        const service = getBulkMemberService(ctx);
        const data = await service.exportMembers(organizationId);
        return ctx.json(data, HttpStatusCodes.OK);
    };

    static importMembers: AppHandler<typeof BulkMemberRoutes.importMembers> = async (ctx) => {
        const organizationId = ctx.get("organizationId")!;
        const members = ctx.req.valid("json");
        const service = getBulkMemberService(ctx);
        const results = await service.importMembers(organizationId, members);
        return ctx.json(results, HttpStatusCodes.OK);
    };
}
