import { betterAuth, BetterAuthOptions } from "better-auth";
import { AppContext, AppOpenApi } from "@api/helpers/types.helpers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { Mailer } from "../mail/mailer.lib";
import * as schema from "../../db/schema.db";
import { organization, openAPI } from 'better-auth/plugins';
import { createAccessControl } from "better-auth/plugins/access";
import { Role, Permission, RolePermissions } from "../../../shared/types/auth-types";

const statements = {
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    billing: ["manage"],
    project: ["create", "delete"]
} as const;

const ac = createAccessControl(statements);

const ownerRole = ac.newRole({
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    billing: ["manage"],
    project: ["create", "delete"]
});

const adminRole = ac.newRole({
    organization: ["update"],
    member: ["create", "update", "delete"],
    project: ["create", "delete"]
});

const memberRole = ac.newRole({
    project: ["create"]
});

export const betterAuthGlobalOptions: BetterAuthOptions = {
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    plugins: [
        organization({
            ac: ac,
            roles: {
                [Role.OWNER]: ownerRole,
                [Role.ADMIN]: adminRole,
                [Role.MEMBER]: memberRole,
            }
        }),
        openAPI()
    ],
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
        baseURL: ctx.env.BETTER_AUTH_URL,
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
                    ctx.env.BETTER_AUTH_URL,
                    ctx.env.FRONTEND_URL,
                ],
            },
        },
        emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, url, token }) => {
                const verificationUrl = `${ctx.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
                ctx.executionCtx.waitUntil(
                    mailer.sendTemplate({
                        to: user.email,
                        templateId: "email-verification",
                        variables: {
                            DISPLAY_NAME: user.name,
                            VERIFICATION_LINK: verificationUrl,
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
