import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const financialTransactionCategories = sqliteTable(
    "financial_transaction_categories",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull().unique(),
        isExpense: integer("is_expense", { mode: "boolean" }).notNull(),
        isRevenue: integer("is_revenue", { mode: "boolean" }).notNull(),
        archivedAt: integer("archived_at", { mode: "timestamp_ms" }), // null = active
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        // Prevent both being true at the same time to ensure categorical clarity.
        // Boolean 1 maps to true in integer(mode: boolean)
        check("expense_revenue_exclusive", sql`NOT (${t.isExpense} = 1 AND ${t.isRevenue} = 1)`),
    ]
);

export type FinancialTransactionCategory = typeof financialTransactionCategories.$inferSelect;
export type NewFinancialTransactionCategory = Omit<
    typeof financialTransactionCategories.$inferInsert,
    "id" | "createdAt"
>;
