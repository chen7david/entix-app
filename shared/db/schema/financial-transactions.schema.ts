import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { financialAccounts } from "./financial-accounts.schema";
import { financialCurrencies } from "./financial-currencies.schema";
import { financialTransactionCategories } from "./financial-transaction-categories.schema";
import { authOrganizations } from "./organization.schema";

export type TransactionMetadata = {
    rateCentsPerMinute?: number;
    durationMinutes?: number;
    participantCount?: number;
    sessionTitle?: string;
} & Record<string, unknown>;

export const financialTransactions = sqliteTable(
    "financial_transactions",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id),
        categoryId: text("category_id")
            .notNull()
            .references(() => financialTransactionCategories.id),
        sourceAccountId: text("source_account_id")
            .notNull()
            .references(() => financialAccounts.id, { onDelete: "restrict" }),
        destinationAccountId: text("destination_account_id")
            .notNull()
            .references(() => financialAccounts.id, { onDelete: "restrict" }),
        currencyId: text("currency_id")
            .notNull()
            .references(() => financialCurrencies.id, { onDelete: "restrict" }),
        amountCents: integer("amount_cents").notNull(),
        status: text("status")
            .notNull()
            .default("completed")
            .$type<"pending" | "completed" | "reversed">(),
        description: text("description"),
        metadata: text("metadata", { mode: "json" }).$type<TransactionMetadata>(),
        transactionDate: integer("transaction_date", { mode: "timestamp_ms" }).notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        // No updatedAt - transactions are immutable records. Reversals create new records.
    },
    (t) => [
        check("amount_cents_positive", sql`${t.amountCents} > 0`),
        check("status_values", sql`${t.status} IN ('pending', 'completed', 'reversed')`),
        // Prevent a transaction from being its own source and destination.
        check("source_dest_different", sql`${t.sourceAccountId} != ${t.destinationAccountId}`),
    ]
);

export type FinancialTransaction = typeof financialTransactions.$inferSelect;

/**
 * Repository input schema for financial transactions.
 * Includes synthetic fields for the atomic double-entry lines (Rule 78).
 */
export const createTransactionRepoInputSchema = createInsertSchema(financialTransactions, {
    id: z.string().min(1),
    createdAt: z.date(),
    transactionDate: z.date(),
}).extend({
    debitLineId: z.string().min(1),
    creditLineId: z.string().min(1),
});

export type CreateTransactionRepoInput = z.infer<typeof createTransactionRepoInputSchema>;

export type NewFinancialTransaction = Omit<
    typeof financialTransactions.$inferInsert,
    "id" | "createdAt"
>;
