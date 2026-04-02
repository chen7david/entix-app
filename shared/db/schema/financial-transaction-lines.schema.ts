import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { financialAccounts } from "./financial-accounts.schema";
import { financialTransactions } from "./financial-transactions.schema";

export const financialTransactionLines = sqliteTable(
    "financial_transaction_lines",
    {
        id: text("id").primaryKey(),
        transactionId: text("transaction_id")
            .notNull()
            .references(() => financialTransactions.id, { onDelete: "cascade" }),
        accountId: text("account_id")
            .notNull()
            .references(() => financialAccounts.id, { onDelete: "restrict" }),
        direction: text("direction").notNull().$type<"debit" | "credit">(),
        amountCents: integer("amount_cents").notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        check("direction_check", sql`${t.direction} IN ('debit', 'credit')`),
        check("amount_cents_positive", sql`${t.amountCents} > 0`),
        index("idx_tx_lines_transaction_id").on(t.transactionId),
        index("idx_tx_lines_account_id").on(t.accountId),
    ]
);

export type FinancialTransactionLine = typeof financialTransactionLines.$inferSelect;
export type NewFinancialTransactionLine = Omit<
    typeof financialTransactionLines.$inferInsert,
    "id" | "createdAt"
>;
