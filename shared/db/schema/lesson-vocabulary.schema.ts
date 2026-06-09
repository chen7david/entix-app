import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { lessons } from "./lesson.schema";
import { vocabularyBank } from "./vocabulary-bank.schema";

export const lessonVocabulary = sqliteTable(
    "lesson_vocabulary",
    {
        lessonId: text("lesson_id")
            .notNull()
            .references(() => lessons.id, { onDelete: "cascade" }),
        vocabularyId: text("vocabulary_id")
            .notNull()
            .references(() => vocabularyBank.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
        addedAt: integer("added_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.lessonId, table.vocabularyId] }),
        index("lesson_vocabulary_lesson_id_idx").on(table.lessonId),
        index("lesson_vocabulary_vocab_id_idx").on(table.vocabularyId),
        check("lesson_vocab_position_positive", sql`${table.position} > 0`),
    ]
);

export type LessonVocabulary = typeof lessonVocabulary.$inferSelect;
export type NewLessonVocabulary = typeof lessonVocabulary.$inferInsert;
