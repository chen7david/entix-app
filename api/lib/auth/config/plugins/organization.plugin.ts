import { AppContext } from "@api/helpers/types.helpers";
import { organization } from "better-auth/plugins";
import { ac, member, owner, admin } from "@shared/auth/permissions";
import { MailService } from "@api/services/mailer.service";
import { links } from "@web/src/constants/links";

export const getOrganizationPluginConfig = (ctx?: AppContext, mailer?: MailService) => organization({
    ac,
    roles: {
        member,
        admin,
        owner,
    },
    async sendInvitationEmail(data) {
        if (!ctx || !mailer) {
            return
        }
        const inviteLink = `${ctx.var.frontendUrl}${links.onboarding.acceptInvitation}?id=${data.id}`;

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
