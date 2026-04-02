import { getRegistrationService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { AuthRoutes } from "./auth.routes";

export class AuthHandler {
    static signupWithOrg: AppHandler<typeof AuthRoutes.signupWithOrg> = async (ctx) => {
        const { email, password, name, organizationName } = ctx.req.valid("json");

        ctx.var.logger.info({ email, organizationName }, "Signup with organization request");

        const registrationService = getRegistrationService(ctx);

        const result = await registrationService.signupWithOrg({
            email,
            name,
            password,
            organizationName,
        });

        ctx.var.logger.info(
            { userId: result.user.id, orgId: result.organization.id },
            "Signup with organization completed"
        );

        return ctx.json({ data: result }, HttpStatusCodes.CREATED);
    };
}
