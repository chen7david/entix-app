import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvConfig } from "@api/helpers/config.helpers";
import { betterAuthGlobalOptions } from "@api/lib/auth/config/global.config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import Database from "better-sqlite3";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadEnv({ path: resolve(rootDir, ".dev.vars") });

const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
if (!d1DatabaseName) throw new Error("Missing CLOUDFLARE_D1_LOCAL_DB");

const url = resolve(rootDir, `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`);

const sqlite = new Database(url);
const db = drizzle(sqlite);

const config = getEnvConfig();

export const auth = betterAuth({
    ...betterAuthGlobalOptions(),
    baseURL: config.FRONTEND_URL,
    secret: config.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "sqlite" }),
});
