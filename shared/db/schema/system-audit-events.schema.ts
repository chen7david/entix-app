import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema";
import { authOrganizations } from "./organization.schema";

export const systemAuditEvents = sqliteTable(
    "system_audit_events",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),

        // What happened
        eventType: text("event_type").notNull(),
        // e.g. "payment.missed", "payment.retry_failed", "billing_plan.changed",
        //      "wallet.topped_up", "member.added", "session.cancelled"

        severity: text("severity", {
            enum: ["info", "warning", "error", "critical"],
        })
            .notNull()
            .default("info"),
        // "info"    → routine events (top-up, plan change)
        // "warning" → needs attention (missed payment, first retry failed)
        // "error"   → action required (all retries exhausted)

        // Who/what triggered it
        actorId: text("actor_id"), // userId if human, null if system
        actorType: text("actor_type", {
            enum: ["user", "system", "admin"],
        })
            .notNull()
            .default("system"),

        // What it relates to (flexible — not FKs, just IDs for reference)
        subjectType: text("subject_type"), // "session_attendance", "financial_account", etc.
        subjectId: text("subject_id"),

        // Human-readable message for the dashboard
        message: text("message").notNull(),

        // Structured payload for programmatic use
        metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),

        // Whether an admin has acknowledged/dismissed this event
        acknowledgedAt: integer("acknowledged_at", { mode: "timestamp_ms" }),
        acknowledgedBy: text("acknowledged_by").references(() => authUsers.id),

        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        // Immutable — no updatedAt
    },
    (t) => [
        check("severity_check", sql`${t.severity} IN ('info', 'warning', 'error', 'critical')`),
        check("actor_type_check", sql`${t.actorType} IN ('system', 'user', 'admin')`),
        index("idx_audit_org_id").on(t.organizationId),
        index("idx_audit_severity").on(t.severity),
        index("idx_audit_event_type").on(t.eventType),
        index("idx_audit_acknowledged").on(t.acknowledgedAt),
        index("idx_audit_created_at").on(t.createdAt),
    ]
);

export type SystemAuditEvent = typeof systemAuditEvents.$inferSelect;
export type NewSystemAuditEvent = typeof systemAuditEvents.$inferInsert;
