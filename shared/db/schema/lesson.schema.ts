import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";
import { authOrganizations } from "./organization.schema";

export const lessons = sqliteTable(
    "lessons",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        coverArtUrl: text("cover_art_url"),
        cefrLevel: text("cefr_level").default(sql`NULL`),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("lessons_organization_id_idx").on(table.organizationId),
        check(
            "cefr_level_check",
            sql`${table.cefrLevel} IS NULL OR ${table.cefrLevel} IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')`
        ),
    ]
);

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
