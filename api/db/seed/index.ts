import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import * as schema from "@shared/db/schema";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

/**
 * Resolves the absolute path to the local D1 SQLite database file.
 * Cloudflare Wrangler stores local D1 state in .wrangler/state/v3/d1/.../*.sqlite
 */
function getLocalD1Path(): string {
    const d1Base = path.resolve(".wrangler/state");

    if (!existsSync(d1Base)) {
        throw new Error(
            `Wrangler state directory not found at ${d1Base}. Have you run migrations locally?`
        );
    }

    // Find the first .sqlite file in the d1 directory specifically
    try {
        const d1SearchPath = path.join(d1Base, "v3/d1");
        const findCmd = `find "${d1SearchPath}" -name "*.sqlite" ! -name "metadata.sqlite" ! -name "*-shm" ! -name "*-wal" | head -n 1`;
        const dbPath = execSync(findCmd, { encoding: "utf-8" }).trim();

        if (!dbPath) {
            throw new Error(
                "No .sqlite database file found in .wrangler/state. Run migrations first."
            );
        }

        return dbPath;
    } catch (_error) {
        throw new Error(
            "Failed to resolve local D1 path via 'find' command. Please ensure 'find' is in your PATH."
        );
    }
}

/**
 * Ensures the root admin user and their baseline state exists.
 * Mirroring 0001_seed_root.sql with idempotency.
 */
async function seedFinancialBasics(db: any) {
    const now = new Date();
    console.log("[SEED] Seeding financial basics (currencies, categories, social media)...");

    // 1. Currencies
    const currencies = [
        {
            id: "fcur_usd",
            code: "USD",
            name: "US Dollar",
            symbol: "$",
            defaultAccountName: "Savings (USD)",
            createdAt: now,
        },
        {
            id: "fcur_cny",
            code: "CNY",
            name: "Chinese Yuan",
            symbol: "¥",
            defaultAccountName: "Savings (CNY)",
            createdAt: now,
        },
        {
            id: "fcur_etd",
            code: "ETD",
            name: "Entix Dollar",
            symbol: "E$",
            defaultAccountName: "Points (ETD)",
            createdAt: now,
        },
        {
            id: "fcur_cad",
            code: "CAD",
            name: "Canadian Dollar",
            symbol: "CA$",
            defaultAccountName: "Savings (CAD)",
            createdAt: now,
        },
        {
            id: "fcur_eur",
            code: "EUR",
            name: "Euro",
            symbol: "€",
            defaultAccountName: "Savings (EUR)",
            createdAt: now,
        },
        {
            id: "fcur_srd",
            code: "SRD",
            name: "Surinamese Dollar",
            symbol: "$",
            defaultAccountName: "Savings (SRD)",
            createdAt: now,
        },
        {
            id: "fcur_aud",
            code: "AUD",
            name: "Australian Dollar",
            symbol: "A$",
            defaultAccountName: "Savings (AUD)",
            createdAt: now,
        },
    ];
    await db.insert(schema.financialCurrencies).values(currencies).onConflictDoNothing();

    // 2. Transaction Categories
    const categories = [
        {
            id: "fcat_cash_deposit",
            name: "Cash Deposit",
            isExpense: false,
            isRevenue: true,
            createdAt: now,
        },
        {
            id: "fcat_store_purchase",
            name: "Store Purchase",
            isExpense: true,
            isRevenue: false,
            createdAt: now,
        },
        {
            id: "fcat_service_fee",
            name: "Service Fee",
            isExpense: true,
            isRevenue: false,
            createdAt: now,
        },
        { id: "fcat_refund", name: "Refund", isExpense: false, isRevenue: false, createdAt: now },
        {
            id: "fcat_internal_transfer",
            name: "Internal Transfer",
            isExpense: false,
            isRevenue: false,
            createdAt: now,
        },
        {
            id: "fcat_system_adjustment",
            name: "System Adjustment",
            isExpense: false,
            isRevenue: false,
            createdAt: now,
        },
    ];
    await db.insert(schema.financialTransactionCategories).values(categories).onConflictDoNothing();

    // 3. Social Media Types
    const smTypes = [
        { id: "smt_wechat", name: "WeChat", description: "WeChat", createdAt: now, updatedAt: now },
        {
            id: "smt_whatsapp",
            name: "WhatsApp",
            description: "WhatsApp",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_telegram",
            name: "Telegram",
            description: "Telegram",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_discord",
            name: "Discord",
            description: "Discord",
            createdAt: now,
            updatedAt: now,
        },
        { id: "smt_reddit", name: "Reddit", description: "Reddit", createdAt: now, updatedAt: now },
        { id: "smt_qq", name: "QQ", description: "QQ", createdAt: now, updatedAt: now },
        {
            id: "smt_github",
            name: "GitHub",
            description: "GitHub developer platform",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_linkedin",
            name: "LinkedIn",
            description: "Professional network",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_twitter",
            name: "Twitter",
            description: "Twitter / X",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_facebook",
            name: "Facebook",
            description: "Facebook social network",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_instagram",
            name: "Instagram",
            description: "Instagram photo sharing",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_youtube",
            name: "YouTube",
            description: "YouTube video platform",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_tiktok",
            name: "TikTok",
            description: "TikTok short-form video",
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "smt_website",
            name: "Website",
            description: "Personal or company website",
            createdAt: now,
            updatedAt: now,
        },
        { id: "smt_other", name: "Other", description: "Other", createdAt: now, updatedAt: now },
    ];
    await db.insert(schema.socialMediaTypes).values(smTypes).onConflictDoNothing();
}

/**
 * Initializes Platform organization and its associated system accounts.
 */
async function seedPlatformOrgAndAccounts(db: any) {
    const orgId = "platform";
    const now = new Date();

    console.log("[SEED] Ensuring Platform organization and system accounts...");

    // 1. Platform Organization
    await db
        .insert(schema.authOrganizations)
        .values({
            id: orgId,
            name: "Platform",
            slug: "platform",
            createdAt: now,
        })
        .onConflictDoNothing();

    // 2. System Accounts for each currency
    const codes = ["usd", "cny", "etd", "cad", "eur", "srd", "aud"];
    const accounts = [];

    for (const code of codes) {
        const currencyId = `fcur_${code}`;
        const upperCode = code.toUpperCase();

        // Treasury Account
        accounts.push({
            id: `facc_treasury_${currencyId}`,
            ownerId: orgId,
            ownerType: "org" as const,
            currencyId,
            organizationId: orgId,
            name: `Platform Treasury — ${upperCode}`,
            balanceCents: 100_000_000, // 1,000,000 units
            isActive: true,
            accountType: "treasury" as const,
            overdraftLimitCents: 0,
            createdAt: now,
            updatedAt: now,
        });

        // Adjustment Account
        accounts.push({
            id: `facc_system_adjustment_${currencyId}`,
            ownerId: orgId,
            ownerType: "org" as const,
            currencyId,
            organizationId: orgId,
            name: `System Adjustment — ${upperCode}`,
            balanceCents: 100_000_000_000_000, // Large float offset
            isActive: true,
            accountType: "system" as const,
            overdraftLimitCents: 0,
            createdAt: now,
            updatedAt: now,
        });
    }

    await db.insert(schema.financialAccounts).values(accounts).onConflictDoNothing();
}

async function seedRootAdmin(db: any) {
    const rootId = "TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK";
    const orgId = "A6xj7krOIJ3n9uHiipspC";
    const accountId = "AgQUkeQr8EQVxrJy02ypz7qCMpBWhslp";
    const now = new Date();

    console.log("[SEED] Ensuring Root Admin and baseline organization...");

    // 1. Root User
    await db
        .insert(schema.authUsers)
        .values({
            id: rootId,
            xid: "ROOTADMIN",
            name: "Root Admin",
            email: "root@admin.com",
            emailVerified: true,
            role: "admin",
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: schema.authUsers.id,
            set: { xid: "ROOTADMIN" },
        });

    // 2. Test Org
    await db
        .insert(schema.authOrganizations)
        .values({
            id: orgId,
            name: "Test Org",
            slug: "testorg",
            createdAt: now,
        })
        .onConflictDoNothing();

    // 3. Auth Account (Credential)
    await db
        .insert(schema.authAccounts)
        .values({
            id: accountId,
            accountId: "root@admin.com",
            providerId: "credential",
            userId: rootId,
            // Hashed 'r00tme'
            password:
                "cc2d5071f13d1f9e88de1fbc0af47530:d88750de3b087b92430198e8dea1e746d406da96c6a429c22c82edcdfeaad3ce06b82beda503d97e3fd0bff2e618be14f743b2d9fdd68cb5b52c2b9a686d858a",
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoNothing();

    await db
        .insert(schema.authMembers)
        .values({
            id: "E2QTyceWPwpj-n_1I5lyR",
            organizationId: orgId,
            userId: rootId,
            role: "owner",
            createdAt: now,
        })
        .onConflictDoNothing();
}

async function main() {
    const dbPath = getLocalD1Path();
    console.log(`[SEED] Connecting to local D1: ${dbPath}`);

    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    try {
        console.log("[SEED] Initializing database seeds...");

        // Sequence dependency: Root Admin and Org first
        await seedRootAdmin(db);

        // Seeding standalone basics
        await seedFinancialBasics(db);

        // Seeding platform accounts (depends on Platform Org and Currencies)
        await seedPlatformOrgAndAccounts(db);

        console.log("✅ [SEED] Database seeding completed successfully.");
    } catch (error) {
        console.error("❌ [SEED] Seeding failed:");
        console.error(error);
        process.exit(1);
    } finally {
        sqlite.close();
    }
}

main();
