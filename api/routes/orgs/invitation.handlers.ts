import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { InvitationRoutes } from './invitation.routes';
import { OrganizationRepository } from '@api/repositories/organization.repository';
import { MemberRepository } from '@api/repositories/member.repository';

export class InvitationHandler {
    static getInvitations: AppHandler<typeof InvitationRoutes.getInvitations> = async (ctx) => {
        const organizationId = ctx.get('organizationId')!;
        const orgRepo = new OrganizationRepository(ctx);

        const invitations = await orgRepo.findInvitationsByOrganization(organizationId);

        return ctx.json({ invitations }, HttpStatusCodes.OK);
    };

    static inviteMember: AppHandler<typeof InvitationRoutes.inviteMember> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { email, role } = ctx.req.valid("json");
        const inviterId = ctx.get("userId")!;
        const orgRepo = new OrganizationRepository(ctx);
        const memberRepo = new MemberRepository(ctx);

        // Check if user is already a member
        const user = await memberRepo.findMembersByOrganization(organizationId);
        const existingMember = user.find(m => m.user.email.toLowerCase() === email.toLowerCase());
        if (existingMember) {
            return ctx.json({ error: "User is already a member of this organization" }, HttpStatusCodes.CONFLICT);
        }

        // Check if user is already invited
        const existingInvitation = await orgRepo.findPendingInvitationByEmail(email, organizationId);
        if (existingInvitation) {
            return ctx.json({ error: "User is already invited to this organization" }, HttpStatusCodes.CONFLICT);
        }

        const invitation = await orgRepo.createInvitation({
            organizationId,
            email,
            role,
            inviterId
        });

        // Note: We are skipping the email sending here for simplicity of the bypass. 
        // In a full implementation, you'd trigger the email service here.

        return ctx.json({ invitation }, HttpStatusCodes.CREATED);
    };

    static cancelInvitation: AppHandler<typeof InvitationRoutes.cancelInvitation> = async (ctx) => {
        const { invitationId } = ctx.req.valid("param");
        const orgRepo = new OrganizationRepository(ctx);

        await orgRepo.cancelInvitation(invitationId);

        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };
}
