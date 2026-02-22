import { AppHandler } from "@api/helpers/types.helpers";
import { AdminRoutes } from "./admin.routes";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { HttpStatusCodes } from "@api/helpers/http.helpers";

export class AdminHandlers {
    static getOrganizations: AppHandler<typeof AdminRoutes.getOrganizations> = async (ctx) => {
        const orgRepo = new OrganizationRepository(ctx);
        const organizations = await orgRepo.getAll(100);

        return ctx.json({ organizations }, HttpStatusCodes.OK);
    };
}
