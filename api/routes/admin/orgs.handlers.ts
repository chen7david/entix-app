import { getOrganizationService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppContext } from "@api/helpers/types.helpers";

export const AdminOrgsHandler = {
    list: async (ctx: AppContext) => {
        ctx.var.logger.info("Fetching global list of all organizations");

        const orgService = getOrganizationService(ctx);
        const orgs = await orgService.findAll();

        const mappedOrgs = orgs.map((org) => ({
            ...org,
            createdAt: org.createdAt.getTime(),
        }));

        ctx.var.logger.info({ count: mappedOrgs.length }, "Global organizations fetched");

        return ctx.json(mappedOrgs, HttpStatusCodes.OK);
    },
};
