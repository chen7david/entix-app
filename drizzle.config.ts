import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: ".dev.vars" });

const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
if (!d1DatabaseName) throw new Error("Missing CLOUDFLARE_D1_LOCAL_DB");

const url = `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`;

export default defineConfig({
    schema: "./api/db/schema.db.ts",
    out: "./api/db/migrations",
    dialect: "sqlite",
    dbCredentials: { url },
});
