import Database from "better-sqlite3";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema";
import { seedFinancials } from "./financial.seed";

loadEnv({ path: ".dev.vars" });

const main = async () => {
    const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
    if (!d1DatabaseName) {
        console.error("❌ Missing CLOUDFLARE_D1_LOCAL_DB in .dev.vars");
        process.exit(1);
    }

    const url = `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`;
    console.log(`🌱 Seeding database at ${url}...`);

    const sqlite = new Database(url);
    const db = drizzle(sqlite, { schema }) as any;

    try {
        await seedFinancials(db);
        console.log("✅ Seeding complete.");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    } finally {
        sqlite.close();
    }
};

main();
