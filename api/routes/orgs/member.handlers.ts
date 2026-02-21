import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { MemberRoutes } from './member.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { ConflictError, InternalServerError } from "@api/errors/app.error";
import { RegistrationService } from "@api/services/registration.service";

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (c) => {
        const { email, name, role } = c.req.valid("json");

        // Get context (verified by middleware)
        const currentUserId = c.get('userId')!;
        const organizationId = c.get('organizationId')!;

        c.var.logger.info({ currentUserId, organizationId, email, name, role }, "Creating new member");
        const registrationService = new RegistrationService(c);
        const userRepo = new UserRepository(c);

        try {
            const result = await registrationService.createUserAndMember(
                email,
                name,
                organizationId,
                role
            );

            // Send password reset email so user can set their own password
            const resetUrl = `${c.env.FRONTEND_URL}/auth/reset-password`;
            c.var.logger.info({ email, resetUrl }, "Sending password reset email");
            await userRepo.sendPasswordResetEmail(email, resetUrl);

            c.var.logger.info({ userId: result.user.id, memberId: result.member.id }, "Member created successfully");

            return c.json(result, HttpStatusCodes.CREATED);
        } catch (error: any) {
            c.var.logger.error({ error }, "Error establishing membership");

            if (error instanceof ConflictError) {
                throw error;
            }

            throw new InternalServerError("Membership creation failed, please try again");
        }
    };
}
