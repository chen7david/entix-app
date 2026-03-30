import type { financialTransactionCategories } from "../schema";

export const financialCategorySeed: (typeof financialTransactionCategories.$inferInsert)[] = [
    { id: "fcat_cash_deposit", name: "Cash Deposit", isExpense: false, isRevenue: true },
    { id: "fcat_store_purchase", name: "Store Purchase", isExpense: true, isRevenue: false },
    { id: "fcat_service_fee", name: "Service Fee", isExpense: true, isRevenue: false },
    {
        id: "fcat_refund",
        name: "Refund",
        isExpense: false,
        isRevenue: false, // neutral — neither debits nor credits org revenue directly
    },
];
