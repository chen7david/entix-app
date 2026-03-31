import { FINANCIAL_CURRENCIES, FINANCIAL_CURRENCY_CONFIG } from "../../constants/financial";
import type { financialCurrencies } from "../schema";

export const financialCurrencySeed: (typeof financialCurrencies.$inferInsert)[] = [
    FINANCIAL_CURRENCIES.USD,
    FINANCIAL_CURRENCIES.CAD,
    FINANCIAL_CURRENCIES.CNY,
    FINANCIAL_CURRENCIES.EUR,
    FINANCIAL_CURRENCIES.ETD,
].map((id) => ({
    id,
    ...FINANCIAL_CURRENCY_CONFIG[id as keyof typeof FINANCIAL_CURRENCY_CONFIG],
}));
