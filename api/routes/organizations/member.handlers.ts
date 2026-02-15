import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { MemberRoutes } from './member.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { OrganizationRepository } from '@api/repositories/organization.repository';
import { MemberRepository } from '@api/repositories/member.repository';
import { nanoid } from "nanoid";
import { HTTPException } from "hono/http-exception";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@api/db/schema.db";
import { eq, and } from "drizzle-orm";
import { validateSession } from "@api/middleware/auth.middleware";

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (c) => {
        const { organizationId } = c.req.valid("param");
        const { email, name, role } = c.req.valid("json");

        // Validate session explicitly
        const currentUserId = await validateSession(c);

        c.var.logger.info({ currentUserId, organizationId, email, name, role }, "Creating new member");

        const userRepo = new UserRepository(c);
        const orgRepo = new OrganizationRepository(c);
        const memberRepo = new MemberRepository(c);

        // Validate organization exists first (before checking user permissions)
        const organization = await orgRepo.findById(organizationId);
        if (!organization) {
            c.var.logger.warn({ organizationId }, "Organization not found");
            throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
                message: "Organization not found"
            });
        }

        // Check if user has permission to add members to this organization
        const db = getDbClient(c);
        const currentMembership = await db.query.member.findFirst({
            where: and(
                eq(schema.member.userId, currentUserId),
                eq(schema.member.organizationId, organizationId)
            )
        });

        if (!currentMembership) {
            c.var.logger.warn({ currentUserId, organizationId }, "Forbidden: User is not a member of this organization");
            throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
                message: "You are not a member of this organization"
            });
        }

        // Check if user has admin or owner role (required to add members)
        const userRoles = (currentMembership.role || "").split(",").map(r => r.trim()).filter(Boolean);
        const canAddMembers = userRoles.includes("owner") || userRoles.includes("admin");

        if (!canAddMembers) {
            c.var.logger.warn({ currentUserId, organizationId, userRoles }, "Forbidden: User lacks permission to add members");
            throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
                message: "You do not have permission to add members to this organization"
            });
        }

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
