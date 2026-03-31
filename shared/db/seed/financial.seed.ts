import type { AppDb } from "@api/factories/db.factory";
import {
    FINANCIAL_ACCOUNTS,
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    FINANCIAL_CURRENCY_CONFIG,
} from "@shared";
import { financialAccounts, financialCurrencies, financialTransactionCategories } from "../schema";

export const seedFinancials = async (db: AppDb) => {
    // Seed currencies
    await db
        .insert(financialCurrencies)
        .values(
            [
                FINANCIAL_CURRENCIES.USD,
                FINANCIAL_CURRENCIES.CAD,
                FINANCIAL_CURRENCIES.CNY,
                FINANCIAL_CURRENCIES.EUR,
                FINANCIAL_CURRENCIES.ETD,
            ].map((id) => ({
                id,
                ...FINANCIAL_CURRENCY_CONFIG[id as keyof typeof FINANCIAL_CURRENCY_CONFIG],
            }))
        )
        .onConflictDoNothing();

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

    // Seed platform treasury account
    // This account is the system-side counterparty for all admin payouts.
    // It is pre-funded at a large balance and is never exposed to users.
    await db
        .insert(financialAccounts)
        .values({
            id: FINANCIAL_ACCOUNTS.PLATFORM_TREASURY,
            ownerId: "org_platform", // Core platform org
            ownerType: "org",
            currencyId: FINANCIAL_CURRENCIES.USD,
            organizationId: null,
            name: "Platform Treasury",
            balanceCents: 100_000_000_00, // $100,000,000 float — adjust as needed
            isActive: true,
        })
        .onConflictDoNothing();
};
