import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema";

/**
 * Append-only system audit event log.
 * Records all significant system events for admin review.
 * Never update or delete rows — this is an immutable audit trail.
 * acknowledgedAt/acknowledgedBy are the only exception (set once, never changed again).
 */
export const systemAuditEvents = sqliteTable(
    "system_audit_events",
    {
        id: text("id").primaryKey(),
        eventType: text("event_type").notNull(),
        severity: text("severity")
            .$type<"info" | "warning" | "error">()
            .notNull()
            .default("info"),
        message: text("message").notNull(),
        actorType: text("actor_type")
            .$type<"user" | "system">()
            .notNull()
            .default("system"),
        actorId: text("actor_id"),
        subjectType: text("subject_type"),
        subjectId: text("subject_id"),
        metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
        acknowledgedAt: integer("acknowledged_at", { mode: "timestamp_ms" }),
        acknowledgedBy: text("acknowledged_by").references(() => authUsers.id),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        index("idx_audit_events_severity").on(t.severity),
        index("idx_audit_events_event_type").on(t.eventType),
        index("idx_audit_events_created_at").on(t.createdAt),
        index("idx_audit_events_acknowledged_at").on(t.acknowledgedAt),
    ]
);

export type SystemAuditEvent = typeof systemAuditEvents.$inferSelect;
export type NewSystemAuditEvent = typeof systemAuditEvents.$inferInsert;
