import { organization } from "better-auth/plugins";
import { ac, member, admin, owner } from "./better-auth.permissions";
import { Mailer } from "../mail/mailer.lib";

interface OrgRbacOptions {
    mailer: Mailer;
    frontendUrl: string;
}

export const orgRBAC = ({ mailer, frontendUrl }: OrgRbacOptions) => organization({
    ac,
    roles: {
        member,
        admin,
        owner,
    },
    async sendInvitationEmail(data) {
        const inviteLink = `${frontendUrl}/auth/accept-invitation?id=${data.id}`;

        await mailer.sendTemplate({
            to: data.email,
            templateId: "org-invitation",
            variables: {
                INVITER_NAME: data.inviter.user.name,
                ORG_NAME: data.organization.name,
                INVITE_LINK: inviteLink,
            }
        });
    },
})