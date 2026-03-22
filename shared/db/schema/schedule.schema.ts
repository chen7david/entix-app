import { sql } from "drizzle-orm";
import {
    sqliteTable,
    text,
    integer,
    index,
    primaryKey,
} from "drizzle-orm/sqlite-core";
import { authOrganizations } from "./organization.schema";
import { authUsers } from "./auth.schema";

export const scheduledSessions = sqliteTable(
    "scheduled_sessions",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        startTime: integer("start_time", { mode: "timestamp_ms" }).notNull(),
        durationMinutes: integer("duration_minutes").notNull(),
        status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).default("scheduled").notNull(),
        seriesId: text("series_id"),
        recurrenceRule: text("recurrence_rule"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("scheduled_session_organizationId_idx").on(table.organizationId),
        index("scheduled_session_seriesId_idx").on(table.seriesId)
    ]
);

export type ScheduledSession = typeof scheduledSessions.$inferSelect;

export const sessionAttendances = sqliteTable(
    "session_attendances",
    {
        sessionId: text("session_id")
            .notNull()
            .references(() => scheduledSessions.id, { onDelete: "cascade" }),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        joinedAt: integer("joined_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        absent: integer("absent", { mode: "boolean" }).default(false).notNull(),
        absenceReason: text("absence_reason"),
        notes: text("notes"),
        paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    },
    (table) => [
        primaryKey({ columns: [table.sessionId, table.userId] }),
        index("session_attendance_sessionId_idx").on(table.sessionId),
        index("session_attendance_userId_idx").on(table.userId),
        index("session_attendance_orgId_idx").on(table.organizationId),
    ]
);

export type SessionAttendance = typeof sessionAttendances.$inferSelect;
