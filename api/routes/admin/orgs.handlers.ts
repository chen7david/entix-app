import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from "@api/helpers/types.helpers";
import { AdminOrgsRoutes } from "./orgs.routes";
import { OrganizationRepository } from "@api/repositories/organization.repository";

export class AdminOrgsHandler {
    static list: AppHandler<typeof AdminOrgsRoutes.list> = async (ctx) => {
        ctx.var.logger.info("Fetching global list of all organizations");

        const orgRepo = new OrganizationRepository(ctx);
        const orgs = await orgRepo.findAll();

        const mappedOrgs = orgs.map(org => ({
            ...org,
            createdAt: org.createdAt.getTime()
        }));

        ctx.var.logger.info({ count: mappedOrgs.length }, "Global organizations fetched");

        return ctx.json(mappedOrgs, HttpStatusCodes.OK);
    };
}
