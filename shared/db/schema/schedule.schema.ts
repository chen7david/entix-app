import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";
import { authUsers } from "./auth.schema";
import { lessons } from "./lesson.schema";
import { authOrganizations } from "./organization.schema";

export const scheduledSessions = sqliteTable(
    "scheduled_sessions",
    {
        /** Omitted when inserting; `.returning()` supplies ids for attendances. Explicit ids only when batching with other statements that reference the row before insert (rare). */
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        lessonId: text("lesson_id")
            .notNull()
            .references(() => lessons.id, { onDelete: "cascade" }),
        teacherId: text("teacher_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        startTime: integer("start_time", { mode: "timestamp_ms" }).notNull(),
        durationMinutes: integer("duration_minutes").notNull(),
        status: text("status", { enum: ["scheduled", "completed", "cancelled"] })
            .default("scheduled")
            .notNull(),
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
        index("scheduled_session_lessonId_idx").on(table.lessonId),
        index("scheduled_session_teacherId_idx").on(table.teacherId),
        index("scheduled_session_seriesId_idx").on(table.seriesId),
    ]
);

export type ScheduledSession = typeof scheduledSessions.$inferSelect;
export type NewScheduledSession = typeof scheduledSessions.$inferInsert;

export const SESSION_PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

export type SessionPaymentStatus = (typeof SESSION_PAYMENT_STATUSES)[number];

export const sessionAttendances = sqliteTable(
    "session_attendances",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
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
        paymentStatus: text("payment_status", { enum: SESSION_PAYMENT_STATUSES })
            .notNull()
            .default("unpaid"),
    },
    (table) => [
        uniqueIndex("session_attendance_session_user_uidx").on(table.sessionId, table.userId),
        check(
            "payment_status_check",
            sql`${table.paymentStatus} IN ('unpaid', 'paid', 'refunded')`
        ),
        index("session_attendance_id_idx").on(table.id),
        index("session_attendance_sessionId_idx").on(table.sessionId),
        index("session_attendance_userId_idx").on(table.userId),
        index("session_attendance_orgId_idx").on(table.organizationId),
    ]
);

export type SessionAttendance = typeof sessionAttendances.$inferSelect;
export type NewSessionAttendance = typeof sessionAttendances.$inferInsert;
