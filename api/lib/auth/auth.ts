import { betterAuth } from "better-auth";
import { AppContext, AppOpenApi } from "@api/helpers/types.helpers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@shared/db/schema";
import { getDbClient } from "@api/factories/db.factory";
import { MailService } from "@api/services/mailer.service";
import { betterAuthGlobalOptions } from "./config/global.config";
import { getEmailAndPasswordConfig } from "./config/features/email-and-password.feature";
import { getEmailVerificationConfig } from "./config/features/email-verification.feature";

export const auth = (ctx: AppContext) => {
    const db = getDbClient(ctx);
    const mailer = new MailService(ctx.env.RESEND_API_KEY);

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: "sqlite",
            schema
        }),
        baseURL: ctx.env.FRONTEND_URL,
        secret: ctx.env.BETTER_AUTH_SECRET,
        ...betterAuthGlobalOptions(ctx, mailer),
        ...getEmailAndPasswordConfig(ctx, mailer),
        ...getEmailVerificationConfig(ctx, mailer),
    });
};

export const mountBetterAuth = (app: AppOpenApi) => {
    app.on(["GET", "POST"], "/api/v1/auth/*", (ctx) => auth(ctx).handler(ctx.req.raw));
}
