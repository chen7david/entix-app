import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadEnv({ path: resolve(rootDir, ".dev.vars") });

const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
if (!d1DatabaseName) throw new Error("Missing CLOUDFLARE_D1_LOCAL_DB");

const url = resolve(rootDir, `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`);

export default defineConfig({
    schema: "./shared/db/schema/index.ts",
    out: "./api/db/migrations",
    dialect: "sqlite",
    dbCredentials: { url },
});
