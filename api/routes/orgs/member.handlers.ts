import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { MemberRoutes } from './member.routes';
import { ConflictError, InternalServerError } from "@api/errors/app.error";
import { getRegistrationService, getUserService } from "@api/factories/service.factory";
import { getUserRepository } from "@api/factories/repository.factory";

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (ctx) => {
        const { email, name, role } = ctx.req.valid("json");

        // Get context (verified by middleware)
        const currentUserId = ctx.get('userId')!;
        const organizationId = ctx.get('organizationId')!;

        ctx.var.logger.info({ currentUserId, organizationId, email, name, role }, "Creating new member");
        const registrationService = getRegistrationService(ctx);
        const userRepo = getUserRepository(ctx);

        try {
            const result = await registrationService.createUserAndMember(
                email,
                name,
                organizationId,
                role
            );

            // Send password reset email so user can set their own password
            const resetUrl = `${ctx.var.frontendUrl}/auth/reset-password`;
            ctx.var.logger.info({ email, resetUrl }, "Sending password reset email");
            await userRepo.sendPasswordResetEmail(email, resetUrl);

            ctx.var.logger.info({ userId: result.user.id, memberId: result.member.id }, "Member created successfully");

            return ctx.json(result, HttpStatusCodes.CREATED);
        } catch (error: unknown) {
            ctx.var.logger.error({ error }, "Error establishing membership");

            if (error instanceof ConflictError) {
                throw error;
            }

            throw new InternalServerError("Membership creation failed, please try again");
        }
    };
}
