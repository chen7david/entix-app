import { betterAuth } from "better-auth";
import { AppOpenApi } from "@api/helpers/types.helpers";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { getBetterAuthOptions } from "./options";
import * as schema from "./../../db/schema.db";

export const auth = (env: CloudflareBindings) => {
    const db = drizzle(env.DB, { schema });

    return betterAuth({
        ...getBetterAuthOptions(env),
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
        database: drizzleAdapter(db, { provider: "sqlite" }),
        security: {
            allowedOrigins: ["*"],
            disableSameOriginProtection: true
        }
    });
};

export const mountBetterAuth = (app: AppOpenApi) => {
    app.on(["GET", "POST"], "/api/v1/auth/*", (c) => auth(c.env).handler(c.req.raw));

}
