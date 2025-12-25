import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { getBetterAuthOptions } from "./api/lib/better-auth/options";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".dev.vars" });

const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
if (!d1DatabaseName) throw new Error("Missing CLOUDFLARE_D1_LOCAL_DB");

const url = `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`;

const sqlite = new Database(url);
const db = drizzle(sqlite);

// Mock environment for CLI usage
const mockEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY || 'mock-key-for-cli',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
} as CloudflareBindings;

export const auth = betterAuth({
    ...getBetterAuthOptions(mockEnv),
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    database: drizzleAdapter(db, { provider: "sqlite" }),
});
