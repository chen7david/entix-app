import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const financialTransactionCategories = sqliteTable(
    "financial_transaction_categories",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        isExpense: integer("is_expense", { mode: "boolean" }).notNull(),
        isRevenue: integer("is_revenue", { mode: "boolean" }).notNull(),
    }
);

export type FinancialTransactionCategory = typeof financialTransactionCategories.$inferSelect;
export type NewFinancialTransactionCategory = typeof financialTransactionCategories.$inferInsert;
