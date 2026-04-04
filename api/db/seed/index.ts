import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { ACCOUNT_TYPES, FINANCIAL_CURRENCIES } from "@shared";
import * as schema from "@shared/db/schema";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { seedFinancials } from "./financial.seed";

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

    // Find the first .sqlite file recursively
    try {
        const findCmd = `find "${d1Base}" -name "*.sqlite" ! -name "*-shm" ! -name "*-wal" | head -n 1`;
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
            // Hashed 'root123' — generated via Better Auth hashPassword(), verified with verifyPassword()
            password:
                "35e62983eaa0bd5008ec18eef12dc364:9f648ab2b80dd9b587441b4bfbca101f026d7d734fc7f72fab6f9be534913839ddc0421f3081891fed46fc448e73e106ca9c3f010e7aff25167abc196e9a824a",
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

    // 5. Root Admin USD Wallet (Savings)
    console.log("[SEED] Ensuring Root Admin USD Wallet...");
    await db
        .insert(schema.financialAccounts)
        .values({
            id: `facc_root_usd_savings`,
            ownerId: rootId,
            ownerType: "user",
            currencyId: FINANCIAL_CURRENCIES.USD,
            organizationId: orgId,
            name: "Personal Wallet (USD)",
            balanceCents: 5000_00, // $5,000.00
            isActive: true,
            accountType: ACCOUNT_TYPES.SAVINGS,
            createdAt: now,
            updatedAt: now,
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

        // Ordering check: financials MUST run first to seed currencies/categories
        // which the Root Admin's financial account references.
        await seedFinancials(db as any);

        // Ensure root admin exists (idempotent)
        await seedRootAdmin(db);

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
