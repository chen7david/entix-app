import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema";

export const socialMediaTypes = sqliteTable("social_media_types", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    image: text("image"),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const userSocialMedias = sqliteTable("user_social_medias", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => authUsers.id, { onDelete: "cascade" }),
    socialMediaTypeId: text("social_media_type_id")
        .notNull()
        .references(() => socialMediaTypes.id, { onDelete: "restrict" }),
    urlOrHandle: text("url_or_handle").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export type SocialMediaType = typeof socialMediaTypes.$inferSelect;
export type NewSocialMediaType = typeof socialMediaTypes.$inferInsert;
export type UserSocialMedia = typeof userSocialMedias.$inferSelect;
export type NewUserSocialMedia = typeof userSocialMedias.$inferInsert;
