import type { AppContext } from "@api/helpers/types.helpers";
import type { MailService } from "@api/services/mailer.service";
import { admin, openAPI } from "better-auth/plugins";
import { getOrganizationPluginConfig } from "./plugins/organization.plugin";

export const getBetterAuthPluginsConfig = (ctx?: AppContext, mailer?: MailService) => [
    getOrganizationPluginConfig(ctx, mailer),
    openAPI(),
    admin({
        defaultRole: "user",
        adminRoles: ["admin"],
    }),
];
