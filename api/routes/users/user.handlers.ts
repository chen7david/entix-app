import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { MemberRepository } from '@api/repositories/member.repository';
import { ConflictError, InternalServerError } from "@api/errors/app.error";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@api/db/schema.db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

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

        const db = getDbClient(c);
        const userRepo = new UserRepository(c);
        const memberRepo = new MemberRepository(c);

        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser) {
            throw new ConflictError("User with this email already exists");
        }

        const dummyPassword = nanoid(32);
        const userResult = await userRepo.createUser({ email, password: dummyPassword, name });

        try {
            await memberRepo.addMember({
                userId: userResult.user.id,
                organizationId,
                role: 'member',
            });

            const resetUrl = `${c.env.FRONTEND_URL}/auth/reset-password`;
            await userRepo.sendPasswordResetEmail(email, resetUrl);

            return c.json({
                id: userResult.user.id,
                name: userResult.user.name,
                email: userResult.user.email,
                emailVerified: userResult.user.emailVerified,
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
            }, HttpStatusCodes.CREATED);
        } catch (error) {
            c.var.logger.error({ error, userId: userResult.user.id }, "Error establishing membership, rolling back user creation");

            await db.delete(schema.account).where(eq(schema.account.userId, userResult.user.id));
            await db.delete(schema.session).where(eq(schema.session.userId, userResult.user.id));
            await db.delete(schema.user).where(eq(schema.user.id, userResult.user.id));

            throw new InternalServerError("Membership creation failed, user creation rolled back");
        }
    }
}