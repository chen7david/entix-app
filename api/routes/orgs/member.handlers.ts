import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { MemberRoutes } from './member.routes';
import { UserRepository } from '@api/repositories/user.repository';
import { MemberRepository } from '@api/repositories/member.repository';
import { ConflictError, InternalServerError } from "@api/errors/app.error";
import { RegistrationService } from "@api/services/registration.service";

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (ctx) => {
        const { email, name, role } = ctx.req.valid("json");

        // Get context (verified by middleware)
        const currentUserId = ctx.get('userId')!;
        const organizationId = ctx.get('organizationId')!;

        ctx.var.logger.info({ currentUserId, organizationId, email, name, role }, "Creating new member");
        const registrationService = new RegistrationService(ctx);
        const userRepo = new UserRepository(ctx);

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
        } catch (error: any) {
            ctx.var.logger.error({ error }, "Error establishing membership");

            if (error instanceof ConflictError) {
                throw error;
            }

            throw new InternalServerError("Membership creation failed, please try again");
        }
    };

    static getMembers: AppHandler<typeof MemberRoutes.getMembers> = async (ctx) => {
        const organizationId = ctx.get('organizationId')!;
        const memberRepo = new MemberRepository(ctx);

        const members = await memberRepo.findMembersByOrganization(organizationId);

        // Map to Better Auth's expected shape for the frontend
        const mappedMembers = members.map((m: any) => ({
            id: m.id,
            organizationId: m.organizationId,
            role: m.role,
            createdAt: m.createdAt,
            userId: m.userId,
            user: {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                image: m.user.image,
            }
        }));

        return ctx.json({ members: mappedMembers }, HttpStatusCodes.OK);
    };

    static updateMemberRole: AppHandler<typeof MemberRoutes.updateMemberRole> = async (ctx) => {
        const { memberId } = ctx.req.valid("param");
        const { role } = ctx.req.valid("json");
        const memberRepo = new MemberRepository(ctx);

        await memberRepo.updateRole(memberId, role);

        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static removeMember: AppHandler<typeof MemberRoutes.removeMember> = async (ctx) => {
        const { memberId } = ctx.req.valid("param");
        const memberRepo = new MemberRepository(ctx);

        await memberRepo.remove(memberId);

        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };
}
