import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema";
import { authOrganizations } from "./organization.schema";

export const AUDIT_SEVERITIES = ["info", "warning", "error", "critical"] as const;
export const AUDIT_ACTOR_TYPES = ["system", "user", "admin"] as const;

export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export const systemAuditEvents = sqliteTable(
    "system_audit_events",
    {
        id: text("id").primaryKey(),

        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),

        eventType: text("event_type").notNull(),

        severity: text("severity", { enum: AUDIT_SEVERITIES })
            .notNull()
            .default("info"),

        actorId: text("actor_id"),

        actorType: text("actor_type", { enum: AUDIT_ACTOR_TYPES })
            .notNull()
            .default("system"),

        subjectType: text("subject_type"),

        subjectId: text("subject_id"),

        message: text("message").notNull(),

        metadata: text("metadata"),

        acknowledgedAt: integer("acknowledged_at", { mode: "timestamp_ms" }),

        acknowledgedBy: text("acknowledged_by").references(() => authUsers.id),

        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        check(
            "severity_check",
            sql`${t.severity} IN ('info', 'warning', 'error', 'critical')`
        ),
        check(
            "actor_type_check",
            sql`${t.actorType} IN ('system', 'user', 'admin')`
        ),
        index("idx_audit_org_id").on(t.organizationId),
        index("idx_audit_severity").on(t.severity),
        index("idx_audit_event_type").on(t.eventType),
        index("idx_audit_acknowledged").on(t.acknowledgedAt),
        index("idx_audit_created_at").on(t.createdAt),
    ]
);

export type SystemAuditEvent = typeof systemAuditEvents.$inferSelect;
export type NewSystemAuditEvent = typeof systemAuditEvents.$inferInsert;
