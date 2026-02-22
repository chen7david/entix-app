import { openAPI, admin } from 'better-auth/plugins';
import { AppContext } from '@api/helpers/types.helpers';
import { Mailer } from '@api/lib/mail/mailer.lib';
import { getOrganizationPluginConfig } from './plugins/organization.plugin';


export const getBetterAuthPluginsConfig = (ctx?: AppContext, mailer?: Mailer) => [
    getOrganizationPluginConfig(ctx, mailer),
    openAPI(),
    admin({
        defaultRole: "user",
        adminRoles: ["admin"],
    })
];
