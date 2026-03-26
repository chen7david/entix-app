import { sql } from "drizzle-orm";
import {
    sqliteTable,
    text,
    integer,
    index,
    primaryKey,
} from "drizzle-orm/sqlite-core";
import { authOrganizations } from "./organization.schema";
import { authUsers } from "./auth.schema";
import { nanoid } from "nanoid";

export const uploads = sqliteTable(
    "uploads",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => nanoid()),
        originalName: text("original_name").notNull(),
        bucketKey: text("bucket_key").notNull(),
        url: text("url").notNull(),
        fileSize: integer("file_size").notNull(),
        contentType: text("content_type").notNull(),
        status: text("status", { enum: ["pending", "completed", "failed"] })
            .notNull() // Reordered notNull and default
            .default("pending"),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        uploadedBy: text("uploaded_by")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp" }) // Changed mode to "timestamp"
            .notNull() // Reordered notNull and default
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        updatedAt: integer("updated_at", { mode: "timestamp" }) // Changed mode to "timestamp"
            .notNull() // Reordered notNull and default
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
            // Removed $onUpdate(() => /* @__PURE__ */ new Date())
    },
    (table) => [
        index("upload_organizationId_idx").on(table.organizationId), // Renamed index
        index("upload_uploadedBy_idx").on(table.uploadedBy), // Renamed index
    ]
);

export type Upload = typeof uploads.$inferSelect; // Renamed type
export type NewUpload = typeof uploads.$inferInsert; // Added new type

export const userUploads = sqliteTable(
    "user_uploads",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        originalName: text("original_name").notNull(),
        bucketKey: text("bucket_key").notNull(),
        url: text("url").notNull(),
        fileSize: integer("file_size").notNull(),
        contentType: text("content_type").notNull(),
        status: text("status", { enum: ["pending", "completed", "failed"] }).default("pending").notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("user_upload_userId_idx").on(table.userId),
    ]
);

export type UserUpload = typeof userUploads.$inferSelect;

export const media = sqliteTable(
    "media",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        mimeType: text("mime_type").notNull(), // 'video/mp4' | 'audio/mpeg'
        mediaUrl: text("media_url").notNull(),
        coverArtUrl: text("cover_art_url"),
        playCount: integer("play_count").default(0).notNull(),
        uploadedBy: text("uploaded_by")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("media_organizationId_idx").on(table.organizationId),
        index("media_uploadedBy_idx").on(table.uploadedBy),
    ]
);

export type Media = typeof media.$inferSelect;

export const playlists = sqliteTable(
    "playlists",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        coverArtUrl: text("cover_art_url"),
        createdBy: text("created_by")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("playlist_organizationId_idx").on(table.organizationId),
        index("playlist_createdBy_idx").on(table.createdBy),
    ]
);

export type Playlist = typeof playlists.$inferSelect;

export const playlistMedia = sqliteTable(
    "playlist_media",
    {
        playlistId: text("playlist_id")
            .notNull()
            .references(() => playlists.id, { onDelete: "cascade" }),
        mediaId: text("media_id")
            .notNull()
            .references(() => media.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
        addedAt: integer("added_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.playlistId, table.mediaId] }),
        index("playlist_media_playlistId_idx").on(table.playlistId),
        index("playlist_media_mediaId_idx").on(table.mediaId),
    ]
);

export type PlaylistMedia = typeof playlistMedia.$inferSelect;
