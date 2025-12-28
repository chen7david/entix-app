import { betterAuth } from "better-auth";
import { AppContext, AppOpenApi } from "@api/helpers/types.helpers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { betterAuthOptions } from "./options";
import * as schema from "./../../db/schema.db";
import { Mailer } from "./../mail/mailer.lib";

export const auth = (ctx: AppContext) => {
    const db = drizzle(ctx.env.DB, { schema });
    const mailer = new Mailer(ctx);

    return betterAuth({
        database: drizzleAdapter(db, { provider: "sqlite" }),
        ...betterAuthOptions,
        baseURL: ctx.env.BETTER_AUTH_URL,
        secret: ctx.env.BETTER_AUTH_SECRET,
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
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
        security: {
            allowOrigin: ['http://localhost:3000', 'https://entix.app']
        },
        advanced: {
            disableCSRFCheck: true
        }
    });
};

export const mountBetterAuth = (app: AppOpenApi) => {
    app.on(["GET", "POST"], "/api/v1/auth/*", (c) => auth(c).handler(c.req.raw));

}
