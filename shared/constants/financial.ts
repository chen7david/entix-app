/**
 * FINANCIAL CONSTANTS
 *
 * IMPORTANT: These constants define the IDs used in the database for currencies,
 * transaction categories, and system accounts.
 *
 * WARNING: Do NOT change these values without a formal database migration
 * and versioning strategy. Changing these IDs will cause foreign key violations
 * and data inconsistency in existing financial records.
 *
 * These constants are also consumed by the Dashboard UI to ensure synchronized
 * lookups for wallet initialization and account creation.
 */

export const FINANCIAL_CURRENCIES = {
    USD: "fcur_usd",
    ETD: "fcur_etd",
    CAD: "fcur_cad",
    CNY: "fcur_cny",
    EUR: "fcur_eur",
} as const;

export const FINANCIAL_CURRENCY_CONFIG = {
    [FINANCIAL_CURRENCIES.USD]: {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        defaultAccountName: "Savings (USD)",
    },
    [FINANCIAL_CURRENCIES.CAD]: {
        code: "CAD",
        name: "Canadian Dollar",
        symbol: "CA$",
        defaultAccountName: "Savings (CAD)",
    },
    [FINANCIAL_CURRENCIES.CNY]: {
        code: "CNY",
        name: "Chinese Yuan",
        symbol: "¥",
        defaultAccountName: "Savings (CNY)",
    },
    [FINANCIAL_CURRENCIES.EUR]: {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        defaultAccountName: "Savings (EUR)",
    },
    [FINANCIAL_CURRENCIES.ETD]: {
        code: "ETD",
        name: "Entix Dollar",
        symbol: "E$",
        defaultAccountName: "Points (ETD)",
    },
} as const;

export const FINANCIAL_CATEGORIES = {
    CASH_DEPOSIT: "fcat_cash_deposit",
    STORE_PURCHASE: "fcat_store_purchase",
    SERVICE_FEE: "fcat_service_fee",
    REFUND: "fcat_refund",
    INTERNAL_TRANSFER: "fcat_internal_transfer",
} as const;

export const FINANCIAL_ACCOUNTS = {
    PLATFORM_TREASURY: "facc_platform_treasury",
} as const;

export type FinancialCurrencyId = (typeof FINANCIAL_CURRENCIES)[keyof typeof FINANCIAL_CURRENCIES];
export type FinancialCategoryId = (typeof FINANCIAL_CATEGORIES)[keyof typeof FINANCIAL_CATEGORIES];
