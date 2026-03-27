import type { AppContext } from "@api/helpers/types.helpers";
import { organization } from "better-auth/plugins";
import { ac, member, owner, admin } from "@shared/auth/permissions";
import { MailService } from "@api/services/mailer.service";
import { AppRoutes } from "@shared/constants/routes";

export const getOrganizationPluginConfig = (ctx?: AppContext, mailer?: MailService) => organization({
    ac,
    roles: {
        member,
        admin,
        owner,
    },
    schema: {
        organization: {
            modelName: "authOrganizations",
        },
        member: {
            modelName: "authMembers",
        },
        invitation: {
            modelName: "authInvitations",
        }
    },
    async sendInvitationEmail(data) {
        if (!ctx || !mailer) {
            return
        }
        const inviteLink = `${ctx.var.frontendUrl}${AppRoutes.onboarding.acceptInvitation}?id=${data.id}`;

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
});
