import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import { AdminOrgsRoutes } from "./orgs.routes";
import { getOrganizationService } from "@api/factories/service.factory";

export class AdminOrgsHandler {
    static list: AppHandler<typeof AdminOrgsRoutes.list> = async (ctx) => {
        ctx.var.logger.info("Fetching global list of all organizations");

        const orgService = getOrganizationService(ctx);
        const orgs = await orgService.findAll();

        const mappedOrgs = orgs.map(org => ({
            ...org,
            createdAt: org.createdAt.getTime(),
        }));

        ctx.var.logger.info({ count: mappedOrgs.length }, "Global organizations fetched");

        return ctx.json(mappedOrgs, HttpStatusCodes.OK);
    };
}
