import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { financialAccounts } from "./financial-accounts.schema";
import { financialTransactions } from "./financial-transactions.schema";

export const financialTransactionLines = sqliteTable("financial_transaction_lines", {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
        .notNull()
        .references(() => financialTransactions.id, { onDelete: "cascade" }),
    accountId: text("account_id")
        .notNull()
        .references(() => financialAccounts.id),
    direction: text("direction").notNull(), // CHECK(direction IN ('debit', 'credit'))
    amountCents: integer("amount_cents").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export type FinancialTransactionLine = typeof financialTransactionLines.$inferSelect;
export type NewFinancialTransactionLine = typeof financialTransactionLines.$inferInsert;
