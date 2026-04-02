import Database from "better-sqlite3";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, eq, or, sql, inArray } from "drizzle-orm";
import * as schema from "../../schema";

loadEnv({ path: ".dev.vars" });

const main = async () => {
    const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
    if (!d1DatabaseName) {
        console.error("❌ Missing CLOUDFLARE_D1_LOCAL_DB in .dev.vars");
        process.exit(1);
    }

    const url = `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`;
    console.log(`🧹 Cleaning up financial data at ${url}...`);

    const sqlite = new Database(url);
    const db = drizzle(sqlite, { schema });

    try {
        // Find IDs of accounts we want to delete
        const accountsToDelete = await db
            .select({ id: schema.financialAccounts.id })
            .from(schema.financialAccounts)
            .where(
                or(
                    sql`name LIKE 'General Fund%'`,
                    and(
                        eq(schema.financialAccounts.ownerType, "org"),
                        or(
                            eq(schema.financialAccounts.name, "Points"),
                            eq(schema.financialAccounts.name, "Savings")
                        )
                    )
                )
            );

        const accountIds = accountsToDelete.map((a) => a.id);

        if (accountIds.length > 0) {
            console.log(`🗑️  Found ${accountIds.length} accounts to delete. Removing associated ledger entries...`);

            // 1. Delete Transaction Lines (Ledger Entries)
            await db
                .delete(schema.financialTransactionLines)
                .where(inArray(schema.financialTransactionLines.accountId, accountIds));
            console.log("✅ Deleted transaction lines");

            // 2. Delete Transactions where these accounts are source or destination
            await db
                .delete(schema.financialTransactions)
                .where(
                    or(
                        inArray(schema.financialTransactions.sourceAccountId, accountIds),
                        inArray(schema.financialTransactions.destinationAccountId, accountIds)
                    )
                );
            console.log("✅ Deleted associated transactions");

            // 3. Finally delete the accounts
            await db
                .delete(schema.financialAccounts)
                .where(inArray(schema.financialAccounts.id, accountIds));
            console.log("✅ Deleted accounts successfully.");
        } else {
            console.log("✨ No accounts found matching the cleanup criteria.");
        }

        console.log("✨ Cleanup complete.");
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
    } finally {
        sqlite.close();
    }
};

main();
