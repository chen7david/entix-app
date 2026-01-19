import { organization, openAPI, admin } from 'better-auth/plugins';

export const betterAuthPluginsConfig = [
    organization(),
    openAPI(),
    admin({
        defaultRole: "user",
        adminRoles: ["admin"],
    })
];
