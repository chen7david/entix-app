import type { financialCurrencies } from "../schema";

export const financialCurrencySeed: (typeof financialCurrencies.$inferInsert)[] = [
    { id: "fcur_usd", code: "USD", name: "US Dollar", symbol: "$" },
    { id: "fcur_cad", code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
    { id: "fcur_eur", code: "EUR", name: "Euro", symbol: "€" },
    { id: "fcur_jpy", code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { id: "fcur_cny", code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { id: "fcur_srd", code: "SRD", name: "Surinamese Dollar", symbol: "Sr$" },
    { id: "fcur_gyd", code: "GYD", name: "Guyanese Dollar", symbol: "G$" },
    { id: "fcur_etd", code: "ETD", name: "Entix Dollar", symbol: "E$" },
];
