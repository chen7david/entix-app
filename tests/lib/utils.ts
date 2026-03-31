import { applyD1Migrations, env } from "cloudflare:test";
import { FINANCIAL_CURRENCIES, FINANCIAL_CURRENCY_CONFIG } from "@shared";
import * as schema from "@shared/db/schema";
import { financialCurrencies as currencyTable } from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";

const migrationFiles = import.meta.glob("/api/db/migrations/*.sql", {
    eager: true,
    query: "?raw",
    import: "default",
});

const migrations = Object.entries(migrationFiles)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([path, sql]) => {
        const name = path.split("/").pop() || path;
        return {
            name,
            queries: [sql as string],
        };
    });

export async function createTestDb() {
    if (migrations.length > 0) {
        await applyD1Migrations(env.DB, migrations);
    }
    const db = drizzle(env.DB, { schema });

    // Seed mandatory financial currencies for registration auto-provisioning
    const currencies = [
        FINANCIAL_CURRENCIES.USD,
        FINANCIAL_CURRENCIES.ETD,
        FINANCIAL_CURRENCIES.CAD,
        FINANCIAL_CURRENCIES.CNY,
        FINANCIAL_CURRENCIES.EUR,
    ].map((id) => ({
        id,
        ...FINANCIAL_CURRENCY_CONFIG[id as keyof typeof FINANCIAL_CURRENCY_CONFIG],
    }));

    for (const c of currencies) {
        await db
            .insert(currencyTable)
            .values({
                ...c,
            })
            .onConflictDoNothing();
    }

    return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
