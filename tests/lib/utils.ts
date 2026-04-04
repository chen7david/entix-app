import { applyD1Migrations, env } from "cloudflare:test";
import {
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    FINANCIAL_CURRENCY_CONFIG,
    getTreasuryAccountId,
} from "@shared";
import * as schema from "@shared/db/schema";
import {
    financialAccounts as accountTable,
    financialTransactionCategories as categoryTable,
    financialCurrencies as currencyTable,
} from "@shared/db/schema";
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

    // Seed all mandatory financial currencies from the global constant
    const allCurrencies = Object.values(FINANCIAL_CURRENCIES);
    const currencies = allCurrencies.map((id) => ({
        id,
        ...FINANCIAL_CURRENCY_CONFIG[id as keyof typeof FINANCIAL_CURRENCY_CONFIG],
    }));

    for (const c of currencies) {
        await db.insert(currencyTable).values(c).onConflictDoNothing();
    }

    // Seed Mandatory Financial Categories
    const categories = Object.values(FINANCIAL_CATEGORIES).map((id) => ({
        id,
        name: id.replace("fcat_", "").replace("_", " ").toUpperCase(),
        description: `Automated seed for ${id}`,
        isExpense: false,
        isRevenue: false,
    }));

    for (const cat of categories) {
        await db.insert(categoryTable).values(cat).onConflictDoNothing();
    }

    // Ensure 'platform' organization exists for treasury scoping
    await db
        .insert(schema.authOrganizations)
        .values({
            id: "platform",
            name: "Platform",
            slug: "platform",
            createdAt: new Date(),
        })
        .onConflictDoNothing();

    // Seed Platform Treasury Accounts for all currencies
    for (const currencyId of allCurrencies) {
        const treasuryId = getTreasuryAccountId(currencyId);
        await db
            .insert(accountTable)
            .values({
                id: treasuryId,
                ownerId: "platform",
                ownerType: "org",
                organizationId: "platform",
                currencyId,
                name: `Platform Treasury (${currencyId.split("_")[1].toUpperCase()})`,
                balanceCents: 1000000000, // Seed with 10M units (cents)
                isActive: true,
                accountType: "treasury",
                updatedAt: new Date(),
                createdAt: new Date(),
            })
            .onConflictDoUpdate({
                target: accountTable.id,
                set: {
                    balanceCents: 1000000000,
                    isActive: true,
                    accountType: "treasury",
                },
            });
    }

    return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
