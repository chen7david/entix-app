import { drizzle } from "drizzle-orm/d1";
import { applyD1Migrations, env } from "cloudflare:test";
import * as schema from "../../api/db/schema.db";

const migrationFiles = import.meta.glob('../../api/db/migrations/*.sql', { eager: true, query: '?raw', import: 'default' });

const migrations = Object.entries(migrationFiles)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([path, sql]) => {
        const name = path.split('/').pop() || path;
        return {
            name,
            queries: [sql as string]
        };
    });

export async function createTestDb() {

    if (migrations.length > 0) {
        await applyD1Migrations(env.DB, migrations);
    }
    const db = drizzle(env.DB, { schema });
    return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
