import type { AppDb } from "@api/factories/db.factory";
import {
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    FINANCIAL_CURRENCY_CONFIG,
    getTreasuryAccountId,
} from "@shared";
import {
    authOrganizations,
    financialAccounts,
    financialCurrencies,
    financialTransactionCategories,
} from "@shared/db/schema";

export const financialCurrencySeed = Object.values(FINANCIAL_CURRENCIES).map((id) => ({
    id,
    ...FINANCIAL_CURRENCY_CONFIG[id as keyof typeof FINANCIAL_CURRENCY_CONFIG],
}));

export const seedFinancials = async (db: AppDb) => {
    // Seed currencies
    await db.insert(financialCurrencies).values(financialCurrencySeed).onConflictDoNothing();

    // Seed transaction categories
    await db
        .insert(financialTransactionCategories)
        .values([
            {
                id: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
                name: "Cash Deposit",
                isExpense: false,
                isRevenue: true,
            },
            {
                id: FINANCIAL_CATEGORIES.STORE_PURCHASE,
                name: "Store Purchase",
                isExpense: true,
                isRevenue: false,
            },
            {
                id: FINANCIAL_CATEGORIES.SERVICE_FEE,
                name: "Service Fee",
                isExpense: true,
                isRevenue: false,
            },
            { id: FINANCIAL_CATEGORIES.REFUND, name: "Refund", isExpense: false, isRevenue: false },
            {
                id: FINANCIAL_CATEGORIES.INTERNAL_TRANSFER,
                name: "Internal Transfer",
                isExpense: false,
                isRevenue: false,
            },
        ])
        .onConflictDoNothing();

    // Seed platform treasury accounts
    // We create one treasury account for every currency in the system.
    // These accounts are the system-side counterparties for all admin layouts/rewards.
    // They are pre-funded with a large float and never exposed to end-users directly.
    const allCurrencies = Object.values(FINANCIAL_CURRENCIES);

    // Ensure 'platform' organization exists for treasury scoping
    await db
        .insert(authOrganizations)
        .values({
            id: "platform",
            name: "Platform",
            slug: "platform",
            createdAt: new Date(),
        })
        .onConflictDoNothing();

    for (const currencyId of allCurrencies) {
        const config =
            FINANCIAL_CURRENCY_CONFIG[currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];

        // 1. Platform Treasury
        await db
            .insert(financialAccounts)
            .values({
                id: getTreasuryAccountId(currencyId),
                ownerId: "platform",
                ownerType: "org",
                currencyId,
                organizationId: "platform",
                name: `Platform Treasury — ${config.code}`,
                balanceCents: 1_000_000_000_00, // $1,000,000,000 float
                isActive: true,
                accountType: "treasury",
            })
            .onConflictDoNothing();

        // 2. System Adjustment (Offset account for Mint/Burn/Seeding)
        await db
            .insert(financialAccounts)
            .values({
                id: `facc_system_adjustment_${currencyId}`,
                ownerId: "platform",
                ownerType: "org",
                currencyId,
                organizationId: "platform",
                name: `System Adjustment — ${config.code}`,
                balanceCents: 1_000_000_000_000_00, // Effectively infinite
                isActive: true,
                accountType: "system",
            })
            .onConflictDoNothing();
    }
};
