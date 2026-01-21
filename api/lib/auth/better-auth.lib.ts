import { betterAuth } from "better-auth";
import { AppContext, AppOpenApi } from "@api/helpers/types.helpers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { Mailer } from "../mail/mailer.lib";
import * as schema from "../../db/schema.db";
import { betterAuthGlobalOptions } from "./config/global.config";
import { getEmailAndPasswordConfig } from "./features/email-and-password.feature";
import { getEmailVerificationConfig } from "./features/email-verification.feature";

export const auth = (ctx: AppContext) => {
    const db = drizzle(ctx.env.DB, { schema });
    const mailer = new Mailer(ctx.env.RESEND_API_KEY);

    return betterAuth({
        database: drizzleAdapter(db, { provider: "sqlite" }),
        ...betterAuthGlobalOptions,
        baseURL: ctx.env.BETTER_AUTH_URL,
        secret: ctx.env.BETTER_AUTH_SECRET,
        ...getEmailAndPasswordConfig(ctx, mailer),
        ...getEmailVerificationConfig(ctx, mailer),
    });
};

export const mountBetterAuth = (app: AppOpenApi) => {
    app.on(["GET", "POST"], "/api/v1/auth/*", (c) => auth(c).handler(c.req.raw));
}
