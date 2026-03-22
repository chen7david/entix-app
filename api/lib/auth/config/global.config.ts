
import { BetterAuthOptions } from 'better-auth';
import { getBetterAuthPluginsConfig } from './plugins.config';
import { AppContext } from '@api/helpers/types.helpers';
import { MailService } from '@api/services/mailer.service';

export const betterAuthGlobalOptions = (ctx?: AppContext, mailer?: MailService): BetterAuthOptions => ({
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    plugins: getBetterAuthPluginsConfig(ctx, mailer),
    logger: {
        disabled: true, // we use pino for logging and disable the messy internal logger
    },
    advanced: {
        useSecureCookies: ctx ? ctx.var.frontendUrl.startsWith("https://") : true,
        disableCSRFCheck: true
    },
    trustedOrigins: ctx ? [ctx.env.FRONTEND_URL, ctx.var.frontendUrl] : undefined,
    user: {
        modelName: "auth_users",
        additionalFields: {
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
        }
    },
    session: {
        modelName: "auth_sessions"
    },
    account: {
        modelName: "auth_accounts"
    },
    verification: {
        modelName: "auth_verifications"
    }
});