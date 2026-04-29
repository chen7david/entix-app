import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";
import { authUsers } from "./auth.schema";
import { authOrganizations } from "./organization.schema";
import { sessionAttendances } from "./schedule.schema";
import { vocabularyBank } from "./vocabulary-bank.schema";

export const studentVocabulary = sqliteTable(
    "student_vocabulary",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        userId: text("user_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        orgId: text("org_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        vocabularyId: text("vocabulary_id")
            .notNull()
            .references(() => vocabularyBank.id, { onDelete: "cascade" }),
        attendanceId: text("attendance_id")
            .notNull()
            .references(() => sessionAttendances.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [
        uniqueIndex("student_vocab_user_vocab_attendance_uidx").on(
            table.userId,
            table.vocabularyId,
            table.attendanceId
        ),
        index("student_vocab_userId_idx").on(table.userId),
        index("student_vocab_orgId_idx").on(table.orgId),
        index("student_vocab_vocabularyId_idx").on(table.vocabularyId),
        index("student_vocab_attendanceId_idx").on(table.attendanceId),
    ]
);

export type StudentVocabulary = typeof studentVocabulary.$inferSelect;
export type NewStudentVocabulary = typeof studentVocabulary.$inferInsert;
