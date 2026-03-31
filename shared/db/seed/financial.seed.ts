import type { AppDb } from "@api/factories/db.factory";
import { financialAccounts, financialCurrencies, financialTransactionCategories } from "../schema";

/**
 * PLATFORM_TREASURY_ACCOUNT_ID is the system-level counterparty for all
 * admin-initiated credits and debits. Must exist before any transaction
 * can be executed. Hard-coded ID so it can be referenced safely in code.
 */
export const PLATFORM_TREASURY_ACCOUNT_ID = "facc_platform_treasury";
export const PLATFORM_ORG_ID = "org_platform";

export const seedFinancials = async (db: AppDb) => {
    // Seed currencies
    await db
        .insert(financialCurrencies)
        .values([
            { id: "fcur_usd", code: "USD", name: "US Dollar", symbol: "$" },
            { id: "fcur_cad", code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
            { id: "fcur_cny", code: "CNY", name: "Chinese Yuan", symbol: "¥" },
            { id: "fcur_etd", code: "ETD", name: "Entix Dollar", symbol: "E$" },
        ])
        .onConflictDoNothing();

    // Seed transaction categories
    await db
        .insert(financialTransactionCategories)
        .values([
            { id: "fcat_cash_deposit", name: "Cash Deposit", isExpense: false, isRevenue: true },
            {
                id: "fcat_store_purchase",
                name: "Store Purchase",
                isExpense: true,
                isRevenue: false,
            },
            { id: "fcat_service_fee", name: "Service Fee", isExpense: true, isRevenue: false },
            { id: "fcat_refund", name: "Refund", isExpense: false, isRevenue: false },
            {
                id: "fcat_internal_transfer",
                name: "Internal Transfer",
                isExpense: false,
                isRevenue: false,
            },
        ])
        .onConflictDoNothing();

    // Seed platform treasury account
    // This account is the system-side counterparty for all admin payouts.
    // It is pre-funded at a large balance and is never exposed to users.
    await db
        .insert(financialAccounts)
        .values({
            id: PLATFORM_TREASURY_ACCOUNT_ID,
            ownerId: PLATFORM_ORG_ID,
            ownerType: "org",
            currencyId: "fcur_usd",
            name: "Platform Treasury",
            balanceCents: 100_000_000_00, // $100,000,000 float — adjust as needed
            isActive: true,
        })
        .onConflictDoNothing();
};
