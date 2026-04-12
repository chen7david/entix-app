import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { authOrganizations } from "./organization.schema";
import { authUsers } from "./auth.schema";

/**
 * Append-only log of all session payment events.
 * Replaces the paidAt column pattern — every charge, refund, and adjustment
 * is recorded here for full auditability. Never update or delete rows.
 */
export const financialSessionPaymentEvents = sqliteTable(
    "financial_session_payment_events",
    {
        id: text("id").primaryKey(),
        sessionId: text("session_id").notNull(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        eventType: text("event_type")
            .$type<"charge" | "refund" | "adjustment" | "waiver">()
            .notNull(),
        amountCents: integer("amount_cents").notNull(),
        currencyId: text("currency_id").notNull(),
        note: text("note"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        createdBy: text("created_by").references(() => authUsers.id),
    },
    (t) => [
        index("idx_session_payment_events_session_id").on(t.sessionId),
        index("idx_session_payment_events_user_id").on(t.userId),
        index("idx_session_payment_events_org_id").on(t.organizationId),
    ]
);

export type FinancialSessionPaymentEvent = typeof financialSessionPaymentEvents.$inferSelect;
export type NewFinancialSessionPaymentEvent = typeof financialSessionPaymentEvents.$inferInsert;
