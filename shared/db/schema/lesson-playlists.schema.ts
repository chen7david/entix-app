import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { lessons } from "./lesson.schema";
import { playlists } from "./media.schema";

export const lessonPlaylists = sqliteTable(
    "lesson_playlists",
    {
        lessonId: text("lesson_id")
            .notNull()
            .references(() => lessons.id, { onDelete: "cascade" }),
        playlistId: text("playlist_id")
            .notNull()
            .references(() => playlists.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
        addedAt: integer("added_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.lessonId, table.playlistId] }),
        index("lesson_playlists_lesson_id_idx").on(table.lessonId),
        index("lesson_playlists_playlist_id_idx").on(table.playlistId),
        check("lesson_playlist_position_positive", sql`${table.position} > 0`),
    ]
);

export type LessonPlaylist = typeof lessonPlaylists.$inferSelect;
export type NewLessonPlaylist = typeof lessonPlaylists.$inferInsert;
