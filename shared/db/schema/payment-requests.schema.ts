import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema";
import { financialAccounts } from "./financial-accounts.schema";
import { financialTransactionCategories } from "./financial-transaction-categories.schema";
import { financialTransactions } from "./financial-transactions.schema";
import { financialCurrencies } from "./financial-currencies.schema";
import { authOrganizations } from "./organization.schema";

export const PAYMENT_REQUEST_TYPES = ["session_payment", "manual_payment"] as const;
export const PAYMENT_REQUEST_STATUSES = [
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled",
] as const;

export type PaymentRequestType = (typeof PAYMENT_REQUEST_TYPES)[number];
export type PaymentRequestStatus = (typeof PAYMENT_REQUEST_STATUSES)[number];

/**
 * Durable payment request record.
 *
 * DESIGN:
 * - Created before any financial work begins (intent-first).
 * - idempotency_key prevents duplicate processing (format: `{type}:{referenceId}:{userId}`).
 * - status tracks the lifecycle: pending → processing → completed | failed | cancelled.
 * - On success, transaction_id is populated and status set to 'completed'.
 * - attempt_count enables retry tracking without additional tables.
 */
export const paymentRequests = sqliteTable(
    "payment_requests",
    {
        id: text("id").primaryKey(),

        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),

        type: text("type", { enum: PAYMENT_REQUEST_TYPES }).notNull(),

        status: text("status", { enum: PAYMENT_REQUEST_STATUSES })
            .notNull()
            .default("pending"),

        amountCents: integer("amount_cents").notNull(),

        currencyId: text("currency_id")
            .notNull()
            .references(() => financialCurrencies.id, { onDelete: "no action" }),

        sourceAccountId: text("source_account_id")
            .notNull()
            .references(() => financialAccounts.id, { onDelete: "restrict" }),

        destinationAccountId: text("destination_account_id")
            .notNull()
            .references(() => financialAccounts.id, { onDelete: "restrict" }),

        categoryId: text("category_id")
            .notNull()
            .references(() => financialTransactionCategories.id, { onDelete: "no action" }),

        // Caller-supplied key that prevents duplicate payment processing.
        // Format convention: `{type}:{referenceId}:{userId}`
        idempotencyKey: text("idempotency_key").notNull(),

        // Polymorphic reference to the domain entity being paid for (e.g. a session).
        referenceType: text("reference_type").notNull(),
        referenceId: text("reference_id").notNull(),

        // Populated on successful completion.
        transactionId: text("transaction_id").references(() => financialTransactions.id, {
            onDelete: "set null",
        }),

        requestedBy: text("requested_by").references(() => authUsers.id, {
            onDelete: "set null",
        }),

        note: text("note"),
        failureReason: text("failure_reason"),

        attemptCount: integer("attempt_count").notNull().default(0),
        lastAttemptedAt: integer("last_attempted_at", { mode: "timestamp_ms" }),
        processedAt: integer("processed_at", { mode: "timestamp_ms" }),

        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),

        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        uniqueIndex("uq_payment_request_idempotency_key").on(t.idempotencyKey),
        index("idx_pr_organization_id").on(t.organizationId),
        index("idx_pr_status").on(t.status),
        index("idx_pr_reference").on(t.referenceType, t.referenceId),
        index("idx_pr_created_at").on(t.createdAt),
        check("pr_type_check", sql`${t.type} IN ('session_payment', 'manual_payment')`),
        check(
            "pr_status_check",
            sql`${t.status} IN ('pending', 'processing', 'completed', 'failed', 'cancelled')`
        ),
        check("pr_amount_positive", sql`${t.amountCents} > 0`),
        check("pr_attempt_count_non_negative", sql`${t.attemptCount} >= 0`),
    ]
);

export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type NewPaymentRequest = typeof paymentRequests.$inferInsert;
