import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { ConflictError, InternalServerError } from "@api/errors/app.error";
import { RegistrationService } from "@api/services/registration.service";
import { auth } from "@api/lib/auth/auth";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@api/db/schema.db";
import { eq } from "drizzle-orm";

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (ctx) => {
        const organizationId = ctx.get('organizationId')!;

        ctx.var.logger.info({ organizationId }, `Fetching users for organization`);

        const userRepo = new UserRepository(ctx);
        const users = await userRepo.findUsersByOrganization(organizationId);

        ctx.var.logger.info({ count: users.length, organizationId }, "Users fetched for organization");

        return ctx.json(users, HttpStatusCodes.OK);
    }

    static create: AppHandler<typeof UserRoutes.create> = async (ctx) => {
        const { email, name } = ctx.req.valid('json');
        const organizationId = ctx.get('organizationId')!;

        ctx.var.logger.info({ email, name, organizationId }, "Creating new user");

        const registrationService = new RegistrationService(ctx);
        const userRepo = new UserRepository(ctx);

        try {
            const result = await registrationService.createUserAndMember(
                email,
                name,
                organizationId,
                'member' // UserHandler explicitly acts as member addition
            );

            // Send password reset email so user can set their own password
            const resetUrl = `${ctx.var.frontendUrl}/auth/reset-password`;
            ctx.var.logger.info({ email, resetUrl }, "Sending password reset email");
            await userRepo.sendPasswordResetEmail(email, resetUrl);

            ctx.var.logger.info({ userId: result.user.id, memberId: result.member.id }, "User created and joined successfully");

            return ctx.json({
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                emailVerified: result.user.emailVerified,
                createdAt: result.member.createdAt,
                updatedAt: result.member.createdAt,
                image: null,
            }, HttpStatusCodes.CREATED);
        } catch (error: any) {
            ctx.var.logger.error({ error }, "Error creating user/membership");

            if (error instanceof ConflictError) {
                throw error;
            }

            throw new InternalServerError("User creation failed, please try again");
        }
    }

    static setActiveOrg: AppHandler<typeof UserRoutes.setActiveOrg> = async (ctx) => {
        const { organizationId } = ctx.req.valid('json');

        const authClient = auth(ctx);
        const session = await authClient.api.getSession({ headers: ctx.req.raw.headers });

        if (!session || !session.session) {
            return ctx.json({ error: 'Unauthorized' }, HttpStatusCodes.UNAUTHORIZED as any);
        }

        const sessionId = session.session.id;
        const db = getDbClient(ctx);

        if (organizationId) {
            // Verify organization exists before setting it
            const org = await db.query.organization.findFirst({
                where: (orgs, { eq }) => eq(orgs.id, organizationId)
            });

            if (!org) {
                return ctx.json({ error: 'Organization not found' }, HttpStatusCodes.NOT_FOUND as any);
            }
        }

        // Direct database update bypassing Better Auth membership checks
        await db.update(schema.session)
            .set({ activeOrganizationId: organizationId })
            .where(eq(schema.session.id, sessionId));

        return ctx.json({ success: true }, HttpStatusCodes.OK);
    }

    static getActiveOrg: AppHandler<typeof UserRoutes.getActiveOrg> = async (ctx) => {
        const authClient = auth(ctx);
        const session = await authClient.api.getSession({ headers: ctx.req.raw.headers });

        if (!session || !session.session) {
            return ctx.json({ error: 'Unauthorized' }, HttpStatusCodes.UNAUTHORIZED as any);
        }

        const sessionId = session.session.id;
        const db = getDbClient(ctx);

        const sessionRecord = await db.query.session.findFirst({
            where: (sessions, { eq }) => eq(sessions.id, sessionId)
        });

        return ctx.json({ organizationId: sessionRecord?.activeOrganizationId || null }, HttpStatusCodes.OK);
    }
}