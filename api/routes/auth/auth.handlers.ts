import { AuthRoutes } from "./auth.routes";
import { AppHandler } from '@api/helpers/types.helpers';
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { ConflictError, InternalServerError } from "@api/errors/app.error";
import { RegistrationService } from "@api/services/registration.service";

export class AuthHandler {
    static signupWithOrg: AppHandler<typeof AuthRoutes.signupWithOrg> = async (ctx) => {
        const { email, password, name, organizationName } = ctx.req.valid("json");

        ctx.var.logger.info({ email, organizationName }, "Signup with organization request");

        const registrationService = new RegistrationService(ctx);

        try {
            const result = await registrationService.signupWithOrg({
                email,
                name,
                password,
                organizationName
            });

            ctx.var.logger.info({ userId: result.user.id, orgId: result.organization.id }, "Signup with organization completed");

            return ctx.json(result, HttpStatusCodes.CREATED);
        } catch (error: any) {
            ctx.var.logger.error({ error }, "Error during organization setup, rolling back");

            if (error instanceof ConflictError) {
                throw error;
            }

            throw new InternalServerError("Failed to setup organization, please try again");
        }
    };
}
