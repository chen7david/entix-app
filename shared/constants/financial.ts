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
    SRD: "fcur_srd",
    AUD: "fcur_aud",
    BTC: "fcur_btc",
} as const;

export const FINANCIAL_CURRENCY_CONFIG = {
    [FINANCIAL_CURRENCIES.USD]: {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        color: "#2e7d32",
        defaultAccountName: "Savings (USD)",
    },
    [FINANCIAL_CURRENCIES.CAD]: {
        code: "CAD",
        name: "Canadian Dollar",
        symbol: "CA$",
        color: "#004792",
        defaultAccountName: "Savings (CAD)",
    },
    [FINANCIAL_CURRENCIES.CNY]: {
        code: "CNY",
        name: "Chinese Yuan",
        symbol: "¥",
        color: "#d32f2f",
        defaultAccountName: "Savings (CNY)",
    },
    [FINANCIAL_CURRENCIES.EUR]: {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        color: "#1565c0",
        defaultAccountName: "Savings (EUR)",
    },
    [FINANCIAL_CURRENCIES.ETD]: {
        code: "ETD",
        name: "Entix Dollar",
        symbol: "E$",
        color: "#0288d1",
        defaultAccountName: "Points (ETD)",
    },
    [FINANCIAL_CURRENCIES.SRD]: {
        code: "SRD",
        name: "Surinamese Dollar",
        symbol: "$",
        color: "#c62828",
        defaultAccountName: "Savings (SRD)",
    },
    [FINANCIAL_CURRENCIES.AUD]: {
        code: "AUD",
        name: "Australian Dollar",
        symbol: "A$",
        color: "#00843D",
        defaultAccountName: "Savings (AUD)",
    },
    [FINANCIAL_CURRENCIES.BTC]: {
        code: "BTC",
        name: "Bitcoin",
        symbol: "₿",
        color: "#f57c00",
        defaultAccountName: "Wallet (BTC)",
    },
} as const;

export const FINANCIAL_CATEGORIES = {
    CASH_DEPOSIT: "fcat_cash_deposit",
    STORE_PURCHASE: "fcat_store_purchase",
    SERVICE_FEE: "fcat_service_fee",
    REFUND: "fcat_refund",
    INTERNAL_TRANSFER: "fcat_internal_transfer",
} as const;

/**
 * Returns the deterministic platform treasury account ID for a given currency.
 * This ensures that every currency has a valid source for admin credits.
 */
export const getTreasuryAccountId = (currencyId: string) => `facc_treasury_${currencyId}`;

export const FINANCIAL_ACCOUNTS = {
    // Deprecated: Use getTreasuryAccountId(currencyId) instead for multi-currency support.
    PLATFORM_TREASURY: "facc_platform_treasury",
} as const;

export type FinancialCurrencyId = (typeof FINANCIAL_CURRENCIES)[keyof typeof FINANCIAL_CURRENCIES];
export type FinancialCategoryId = (typeof FINANCIAL_CATEGORIES)[keyof typeof FINANCIAL_CATEGORIES];
