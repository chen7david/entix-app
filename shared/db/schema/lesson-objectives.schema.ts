import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";
import { lessons } from "./lesson.schema";

export const lessonObjectives = sqliteTable(
    "lesson_objectives",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        lessonId: text("lesson_id")
            .notNull()
            .references(() => lessons.id, { onDelete: "cascade" }),
        objective: text("objective").notNull(),
        position: integer("position").notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("lesson_objectives_lesson_id_idx").on(table.lessonId),
        uniqueIndex("lesson_objectives_lesson_id_position_uidx").on(table.lessonId, table.position),
        check("objective_not_empty", sql`length(trim(${table.objective})) > 0`),
        check("objective_position_positive", sql`${table.position} > 0`),
    ]
);

export type LessonObjective = typeof lessonObjectives.$inferSelect;
export type NewLessonObjective = typeof lessonObjectives.$inferInsert;
