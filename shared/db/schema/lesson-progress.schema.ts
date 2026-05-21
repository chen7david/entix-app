import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";
import { sessionAttendances } from "./schedule.schema";

export const lessonProgress = sqliteTable(
    "lesson_progress",
    {
        logId: text("log_id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        enrollId: text("enroll_id")
            .notNull()
            .references(() => sessionAttendances.id, { onDelete: "cascade" }),
        lessonElementId: text("lesson_element_id"),
        actionType: text("action_type").notNull(),
        timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
        metricData: text("metric_data"),
    },
    (table) => [index("lesson_progress_enroll_id_idx").on(table.enrollId)]
);

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
