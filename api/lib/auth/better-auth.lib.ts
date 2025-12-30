import { betterAuth, BetterAuthOptions } from "better-auth";
import { AppContext, AppOpenApi } from "@api/helpers/types.helpers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { Mailer } from "../mail/mailer.lib";
import * as schema from "../../db/schema.db";
import { organization } from 'better-auth/plugins';

export const betterAuthGlobalOptions: BetterAuthOptions = {
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    plugins: [organization()],
    advanced: {
        disableCSRFCheck: true
    },
};

export const auth = (ctx: AppContext) => {
    const db = drizzle(ctx.env.DB, { schema });
    const mailer = new Mailer(ctx.env.RESEND_API_KEY);

    return betterAuth({
        database: drizzleAdapter(db, { provider: "sqlite" }),
        ...betterAuthGlobalOptions,
        baseURL: ctx.env.VITE_BETTER_AUTH_URL,
        secret: ctx.env.BETTER_AUTH_SECRET,
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
            sendResetPassword: async ({ user, url }) => {
                ctx.executionCtx.waitUntil(
                    mailer.sendTemplate({
                        to: user.email,
                        templateId: "reset-password",
                        variables: {
                            DISPLAY_NAME: user.name,
                            RESET_LINK: url,
                        },
                    })
                );
            },
            onPasswordReset: async ({ user }) => {
                console.log(`Password for user ${user.email} has been reset.`);
            },
            resetPassword: {
                allowedRedirectURLs: [
                    ctx.env.VITE_BETTER_AUTH_URL,
                    ctx.env.FRONTEND_URL,
                ],
            },
        },
        emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, url }) => {
                ctx.executionCtx.waitUntil(
                    mailer.sendTemplate({
                        to: user.email,
                        templateId: "email-verification",
                        variables: {
                            DISPLAY_NAME: user.name,
                            VERIFICATION_LINK: url,
                        },
                    })
                );
            }
        },
    });
};

export const mountBetterAuth = (app: AppOpenApi) => {
    app.on(["GET", "POST"], "/api/v1/auth/*", (c) => auth(c).handler(c.req.raw));

}
