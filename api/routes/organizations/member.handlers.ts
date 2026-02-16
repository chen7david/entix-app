import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { MemberRoutes } from './member.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { OrganizationRepository } from '@api/repositories/organization.repository';
import { MemberRepository } from '@api/repositories/member.repository';
import { HTTPException } from "hono/http-exception";
import { ForbiddenError } from "@api/errors/app.error";
import { nanoid } from "nanoid"; // Assuming nanoid is imported from 'nanoid'

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (c) => {
        const { email, name, role } = c.req.valid("json");

        // Get context (verified by middleware)
        const currentUserId = c.get('userId')!;
        const organizationId = c.get('organizationId')!;
        const currentRole = c.get('membershipRole')!;

        c.var.logger.info({ currentUserId, organizationId, email, name, role }, "Creating new member");

        // Verify current user has permission (owner or admin)
        if (!['owner', 'admin'].includes(currentRole)) {
            c.var.logger.warn({ currentUserId, organizationId, role: currentRole }, "Forbidden: User lacks permission to add members");
            throw new ForbiddenError("Only owners and admins can add members");
        }

        const userRepo = new UserRepository(c);
        const orgRepo = new OrganizationRepository(c);
        const memberRepo = new MemberRepository(c);

        // Check if user already exists
        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser) {
            c.var.logger.warn({ email }, "User with this email already exists");
            throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
                message: "User with this email already exists"
            });
        }

        // Generate random secure password (not disclosed to user)
        const dummyPassword = nanoid(32); // Secure random password

        // Create user (email verification sent automatically if sendOnSignUp: true)
        c.var.logger.info({ email }, "Creating user");
        const userResult = await userRepo.createUser({
            email,
            password: dummyPassword,
            name,
        });

        // Add member to organization
        c.var.logger.info({ userId: userResult.user.id, organizationId, role }, "Adding member to organization");
        const memberResult = await memberRepo.addMember({
            userId: userResult.user.id,
            organizationId,
            role,
        });

        // Send password reset email so user can set their own password
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
