import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { lessons } from "./lesson.schema";
import { passages } from "./passages.schema";

export const lessonPassages = sqliteTable(
    "lesson_passages",
    {
        lessonId: text("lesson_id")
            .notNull()
            .references(() => lessons.id, { onDelete: "cascade" }),
        passageId: text("passage_id")
            .notNull()
            .references(() => passages.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
        addedAt: integer("added_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.lessonId, table.passageId] }),
        index("lp_lesson_idx").on(table.lessonId),
        index("lp_passage_idx").on(table.passageId),
        uniqueIndex("lp_lesson_position_uidx").on(table.lessonId, table.position),
        check("lesson_passage_position_positive", sql`${table.position} > 0`),
    ]
);

export type LessonPassage = typeof lessonPassages.$inferSelect;
export type NewLessonPassage = typeof lessonPassages.$inferInsert;
