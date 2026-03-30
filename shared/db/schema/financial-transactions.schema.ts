import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { financialAccounts } from "./financial-accounts.schema";
import { financialCurrencies } from "./financial-currencies.schema";
import { financialTransactionCategories } from "./financial-transaction-categories.schema";

export const financialTransactions = sqliteTable("financial_transactions", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    categoryId: text("category_id")
        .notNull()
        .references(() => financialTransactionCategories.id),
    sourceAccountId: text("source_account_id")
        .notNull()
        .references(() => financialAccounts.id),
    destinationAccountId: text("destination_account_id")
        .notNull()
        .references(() => financialAccounts.id),
    currencyId: text("currency_id")
        .notNull()
        .references(() => financialCurrencies.id),
    amountCents: integer("amount_cents").notNull(), // CHECK(amount_cents > 0)
    status: text("status").notNull().default("completed"), // CHECK (status IN ('pending', 'completed', 'reversed'))
    description: text("description"),
    transactionDate: integer("transaction_date", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type NewFinancialTransaction = typeof financialTransactions.$inferInsert;
