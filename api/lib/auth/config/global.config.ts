import type { AppContext } from "@api/helpers/types.helpers";
import type { MailService } from "@api/services/mailer.service";
import type { BetterAuthOptions } from "better-auth";
import { getBetterAuthPluginsConfig } from "./plugins.config";

export const betterAuthGlobalOptions = (
    ctx?: AppContext,
    mailer?: MailService
): BetterAuthOptions => ({
    appName: "entix-app",
    basePath: "/api/v1/auth",
    plugins: getBetterAuthPluginsConfig(ctx, mailer),
    logger: {
        disabled: true, // we use pino for logging and disable the messy internal logger
    },
    advanced: {
        useSecureCookies: ctx ? ctx.var.frontendUrl.startsWith("https://") : true,
        disableCSRFCheck: true,
    },
    trustedOrigins: ctx ? [ctx.env.FRONTEND_URL, ctx.var.frontendUrl] : undefined,
    user: {
        modelName: "authUsers",
        additionalFields: {
            xid: {
                type: "string",
                required: false,
                input: false,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false,
            },
            theme: {
                type: "string",
                required: false,
                defaultValue: "system",
                input: true,
            },
            timezone: {
                type: "string",
                required: false,
                input: true,
            },
        },
    },
    session: {
        modelName: "authSessions",
    },
    account: {
        modelName: "authAccounts",
    },
    verification: {
        modelName: "authVerifications",
    },
});
