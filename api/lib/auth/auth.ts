import { getDbClient } from "@api/factories/db.factory";
import { patchD1Adapter } from "@api/helpers/auth-adapter.helpers";
import type { AppContext, AppOpenApi } from "@api/helpers/types.helpers";
import { MailService } from "@api/services/mailer.service";
import * as schema from "@shared/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getEmailAndPasswordConfig } from "./config/features/email-and-password.feature";
import { getEmailVerificationConfig } from "./config/features/email-verification.feature";
import { betterAuthGlobalOptions } from "./config/global.config";

export const auth = (ctx: AppContext) => {
    const db = getDbClient(ctx);
    const mailer = new MailService(ctx.env.RESEND_API_KEY);

    const adapter = drizzleAdapter(db, {
        provider: "sqlite",
        schema,
    });

    // patchD1Adapter removed — was causing conflicts with Better Auth internals.
    // Better Auth's Drizzle adapter handles D1 natively as of current version (v1.4+).
    // Re-enable if D1 batch/transaction errors resurface.
    return betterAuth({
        database: adapter,
        baseURL: ctx.env.FRONTEND_URL,
        secret: ctx.env.BETTER_AUTH_SECRET,
        ...betterAuthGlobalOptions(ctx, mailer),
        ...getEmailAndPasswordConfig(ctx, mailer),
        ...getEmailVerificationConfig(ctx, mailer),
    });
};

export const mountBetterAuth = (app: AppOpenApi) => {
    app.on(["GET", "POST"], "/api/v1/auth/*", async (ctx) => {
        try {
            return await auth(ctx).handler(ctx.req.raw);
        } catch (error) {
            console.error("Critical Auth Error:", error);
            throw error;
        }
    });
};

export type Auth = ReturnType<typeof auth>;
export type AuthApi = Auth["api"];
