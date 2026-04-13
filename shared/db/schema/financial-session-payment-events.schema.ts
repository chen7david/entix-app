import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema";
import { financialTransactions } from "./financial-transactions.schema";
import { authOrganizations } from "./organization.schema";
import { scheduledSessions } from "./schedule.schema";

export const SESSION_PAYMENT_EVENT_TYPES = [
    "paid",
    "refunded",
    "manual_paid",
    "manual_reset",
] as const;

export type SessionPaymentEventType = (typeof SESSION_PAYMENT_EVENT_TYPES)[number];

/**
 * Audit log of all payment-related events for a session attendance.
 *
 * POLICY:
 * 1. Transactional events (paid/refunded) are linked to a financial_transaction.
 * 2. Manual overrides (manual_paid/manual_reset) are logically "free" and have no transaction.
 * 3. Only ONE manual override is permitted per user/session pair to avoid accounting ambiguity.
 */
export const financialSessionPaymentEvents = sqliteTable(
    "financial_session_payment_events",
    {
        id: text("id").primaryKey(),

        sessionId: text("session_id")
            .notNull()
            .references(() => scheduledSessions.id, { onDelete: "cascade" }),

        userId: text("user_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),

        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),

        eventType: text("event_type", {
            enum: SESSION_PAYMENT_EVENT_TYPES,
        }).notNull(),

        // Link back to the immutable double-entry ledger.
        // NULL for manual overrides.
        transactionId: text("transaction_id").references(() => financialTransactions.id, {
            onDelete: "set null",
        }),

        amountCents: integer("amount_cents"),

        // Actor who triggered this event (Admin or System).
        performedBy: text("performed_by").references(() => authUsers.id, { onDelete: "set null" }),

        // mandatory for manual overrides for audit clarity.
        note: text("note"),

        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        // Prevents duplicate automated payments for the same user/session/transaction.
        uniqueIndex("uq_spe_session_user_transaction")
            .on(t.sessionId, t.userId, t.transactionId)
            .where(sql`${t.transactionId} IS NOT NULL`),

        // Prevents duplicate manual events per student per session.
        // This index ensures only ONE manual record can exist for a sessionId+userId pair
        // if transactionId is NULL.
        uniqueIndex("uq_spe_session_user_manual")
            .on(t.sessionId, t.userId, t.eventType)
            .where(sql`${t.transactionId} IS NULL`),

        check(
            "event_type_check",
            sql`${t.eventType} IN ('paid', 'refunded', 'manual_paid', 'manual_reset')`
        ),

        check(
            "manual_override_note_required",
            sql`${t.eventType} NOT IN ('manual_paid', 'manual_reset') OR ${t.note} IS NOT NULL`
        ),

        index("idx_spe_session_id").on(t.sessionId),
        index("idx_spe_user_id").on(t.userId),
        index("idx_spe_org_id").on(t.organizationId),
        index("idx_spe_created_at").on(t.createdAt),
    ]
);

export type FinancialSessionPaymentEvent = typeof financialSessionPaymentEvents.$inferSelect;
export type NewFinancialSessionPaymentEvent = typeof financialSessionPaymentEvents.$inferInsert;
