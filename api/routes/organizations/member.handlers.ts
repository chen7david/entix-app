import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { MemberRoutes } from './member.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { OrganizationRepository } from '@api/repositories/organization.repository';
import { MemberRepository } from '@api/repositories/member.repository';
import { nanoid } from "nanoid";
import { HTTPException } from "hono/http-exception";

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (c) => {
        const { organizationId } = c.req.valid("param");
        const { email, name, role } = c.req.valid("json");

        const userRepo = new UserRepository(c);
        const orgRepo = new OrganizationRepository(c);
        const memberRepo = new MemberRepository(c);

        c.var.logger.info({ organizationId, email, name, role }, "Creating new member");

        // 1. Validate organization exists
        const organization = await orgRepo.findById(organizationId);
        if (!organization) {
            c.var.logger.warn({ organizationId }, "Organization not found");
            throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
                message: "Organization not found"
            });
        }

        // 2. Check if user already exists
        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser) {
            c.var.logger.warn({ email }, "User with this email already exists");
            throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
                message: "User with this email already exists"
            });
        }

        // 3. Generate random secure password (not disclosed to user)
        const dummyPassword = nanoid(32); // Secure random password

        // 4. Create user (email verification sent automatically if sendOnSignUp: true)
        c.var.logger.info({ email }, "Creating user");
        const userResult = await userRepo.createUser({
            email,
            password: dummyPassword,
            name,
        });

        // 5. Add member to organization
        c.var.logger.info({ userId: userResult.user.id, organizationId, role }, "Adding member to organization");
        const memberResult = await memberRepo.addMember({
            userId: userResult.user.id,
            organizationId,
            role,
        });

        // 6. Send password reset email so user can set their own password
        const resetUrl = `${c.env.FRONTEND_URL}/auth/reset-password`;
        c.var.logger.info({ email, resetUrl }, "Sending password reset email");
        await userRepo.sendPasswordResetEmail(email, resetUrl);

        c.var.logger.info({ userId: userResult.user.id, memberId: memberResult.id }, "Member created successfully");

        return c.json({
            member: memberResult,
            user: {
                id: userResult.user.id,
                email: userResult.user.email,
                name: userResult.user.name,
                emailVerified: userResult.user.emailVerified,
            },
        }, HttpStatusCodes.OK);
    };
}
