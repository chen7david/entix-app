import { drizzle } from "drizzle-orm/d1";
import { applyD1Migrations, env } from "cloudflare:test";
import * as schema from "../api/db/schema.db";

// Use Vite's import.meta.glob to load all SQL migrations as raw strings
const migrationFiles = import.meta.glob('../api/db/migrations/*.sql', { eager: true, query: '?raw', import: 'default' });

export async function createTestDb() {
    // 1. Prepare migrations list
    const migrations = Object.entries(migrationFiles)
        .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
        .map(([path, sql]) => {
            const name = path.split('/').pop() || path;
            return {
                name,
                queries: [sql as string]
            };
        });

    // 2. Apply migrations
    if (migrations.length > 0) {
        await applyD1Migrations(env.DB, migrations);
    }

    // 3. Create Drizzle client
    const db = drizzle(env.DB, { schema });
    return db;
}
