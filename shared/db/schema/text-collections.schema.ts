import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TEXT_COLLECTION_TYPES } from "../../constants/passage";
import { generateOpaqueId } from "../../lib/id";
import { authOrganizations } from "./organization.schema";

export { TEXT_COLLECTION_TYPES, type TextCollectionType } from "../../constants/passage";

export const textCollections = sqliteTable(
    "text_collections",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        author: text("author"),
        description: text("description"),
        type: text("type", { enum: TEXT_COLLECTION_TYPES }).notNull().default("book"),
        cefrLevel: text("cefr_level"),
        bucketKey: text("bucket_key"),
        r2Url: text("r2_url"),
        totalPages: integer("total_pages"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("tc_org_idx").on(table.organizationId)]
);

export type TextCollection = typeof textCollections.$inferSelect;
export type NewTextCollection = typeof textCollections.$inferInsert;
