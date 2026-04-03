import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync } from "node:fs";
import path from "node:path";
import { seedFinancials } from "./financial.seed";
import * as schema from "@shared/db/schema";

import { execSync } from "node:child_process";

/**
 * Resolves the absolute path to the local D1 SQLite database file.
 * Cloudflare Wrangler stores local D1 state in .wrangler/state/v3/d1/.../*.sqlite
 */
function getLocalD1Path(): string {
    const d1Base = path.resolve(".wrangler/state");
    
    if (!existsSync(d1Base)) {
        throw new Error(`Wrangler state directory not found at ${d1Base}. Have you run migrations locally?`);
    }

    // Find the first .sqlite file recursively
    try {
        const findCmd = `find "${d1Base}" -name "*.sqlite" ! -name "*-shm" ! -name "*-wal" | head -n 1`;
        const dbPath = execSync(findCmd, { encoding: "utf-8" }).trim();

        if (!dbPath) {
            throw new Error("No .sqlite database file found in .wrangler/state. Run migrations first.");
        }

        return dbPath;
    } catch (error) {
        throw new Error("Failed to resolve local D1 path via 'find' command. Please ensure 'find' is in your PATH.");
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
    await db.insert(schema.authUsers)
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
    await db.insert(schema.authOrganizations)
        .values({
            id: orgId,
            name: "Test Org",
            slug: "testorg",
            createdAt: now,
        })
        .onConflictDoNothing();

    // 3. Auth Account (Credential)
    await db.insert(schema.authAccounts)
        .values({
            id: accountId,
            accountId: "root@admin.com",
            providerId: "credential",
            userId: rootId,
            // Hashed 'root123'
            password: "75d6de8e87453904bdb786b8ed47b057:5af447d3a01933ef579d8b64b7b65b100155be0a682304e7f1781394ee57d014c09ae644b0659de66d4022df1be32580c85df7f2256a22f51ea59d2373e22f29",
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoNothing();

    // 4. Org Membership
    await db.insert(schema.authMembers)
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
        
        // Ensure root admin exists (idempotent)
        await seedRootAdmin(db);

        // Ordering check: financials relies on currencies and categories
        // financial.seed.ts handles both in its main export
        await seedFinancials(db as any);

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
