import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { ConflictError, InternalServerError } from "@api/errors/app.error";
import { RegistrationService } from "@api/services/registration.service";

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (c) => {
        const organizationId = c.req.valid('param').organizationId;

        c.var.logger.info({ organizationId }, `Fetching users for organization`);

        const userRepo = new UserRepository(c);
        const users = await userRepo.findUsersByOrganization(organizationId);

        c.var.logger.info({ count: users.length, organizationId }, "Users fetched for organization");

        return c.json(users, HttpStatusCodes.OK);
    }

    static create: AppHandler<typeof UserRoutes.create> = async (c) => {
        const { email, name } = c.req.valid('json');
        const organizationId = c.req.valid('param').organizationId;

        c.var.logger.info({ email, name, organizationId }, "Creating new user");

        const registrationService = new RegistrationService(c);
        const userRepo = new UserRepository(c);

        try {
            const result = await registrationService.createUserAndMember(
                email,
                name,
                organizationId,
                'member' // UserHandler explicitly acts as member addition
            );

            // Send password reset email so user can set their own password
            const resetUrl = `${c.env.FRONTEND_URL}/auth/reset-password`;
            c.var.logger.info({ email, resetUrl }, "Sending password reset email");
            await userRepo.sendPasswordResetEmail(email, resetUrl);

            c.var.logger.info({ userId: result.user.id, memberId: result.member.id }, "User created and joined successfully");

            return c.json({
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                emailVerified: result.user.emailVerified,
                createdAt: result.member.createdAt,
                updatedAt: result.member.createdAt,
                image: null,
            }, HttpStatusCodes.CREATED);
        } catch (error: any) {
            c.var.logger.error({ error }, "Error creating user/membership");

            if (error instanceof ConflictError) {
                throw error;
            }

            throw new InternalServerError("User creation failed, please try again");
        }
    }
}