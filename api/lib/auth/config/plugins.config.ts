import { openAPI, admin } from 'better-auth/plugins';
import type { AppContext } from '@api/helpers/types.helpers';
import { MailService } from '@api/services/mailer.service';
import { getOrganizationPluginConfig } from './plugins/organization.plugin';


export const getBetterAuthPluginsConfig = (ctx?: AppContext, mailer?: MailService) => [
    getOrganizationPluginConfig(ctx, mailer),
    openAPI(),
    admin({
        defaultRole: "user",
        adminRoles: ["admin"],
    })
];
