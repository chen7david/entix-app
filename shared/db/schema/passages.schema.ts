import { IMAGE_POSITIONS, PASSAGE_TYPES } from "../../constants/passage";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateOpaqueId } from "../../lib/id";
import { authOrganizations } from "./organization.schema";
import { textCollections } from "./text-collections.schema";

export {
    IMAGE_POSITIONS,
    type ImagePosition,
    PASSAGE_TYPES,
    type PassageType,
} from "../../constants/passage";

export const passages = sqliteTable(
    "passages",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        collectionId: text("collection_id").references(() => textCollections.id, {
            onDelete: "set null",
        }),
        title: text("title"),
        type: text("type", { enum: PASSAGE_TYPES }).notNull().default("reading"),
        cefrLevel: text("cefr_level"),
        content: text("content"),
        bucketKey: text("bucket_key"),
        r2Url: text("r2_url"),
        pageNumber: integer("page_number"),
        wordCount: integer("word_count"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("ps_org_idx").on(table.organizationId),
        index("ps_collection_idx").on(table.collectionId),
    ]
);

export const passageImages = sqliteTable(
    "passage_images",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => generateOpaqueId()),
        passageId: text("passage_id")
            .notNull()
            .references(() => passages.id, { onDelete: "cascade" }),
        uploadId: text("upload_id"),
        imageUrl: text("image_url").notNull(),
        altText: text("alt_text"),
        caption: text("caption"),
        position: text("position", { enum: IMAGE_POSITIONS }).notNull().default("bottom"),
        sortOrder: integer("sort_order").notNull().default(0),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [index("pi_passage_idx").on(table.passageId)]
);

export type Passage = typeof passages.$inferSelect;
export type NewPassage = typeof passages.$inferInsert;
export type PassageImage = typeof passageImages.$inferSelect;
export type NewPassageImage = typeof passageImages.$inferInsert;
