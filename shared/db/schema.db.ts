import { relations, sql } from "drizzle-orm";
import {
    sqliteTable,
    text,
    integer,
    index,
    uniqueIndex,
    primaryKey,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
        .default(false)
        .notNull(),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    role: text("role").default("user").notNull(),
    banned: integer("banned", { mode: "boolean" }).default(false).notNull(),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
    theme: text("theme").default("system"),
    timezone: text("timezone"),
});

export type User = typeof user.$inferSelect;

export const session = sqliteTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
        token: text("token").notNull().unique(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        activeOrganizationId: text("active_organization_id"),
        impersonatedBy: text("impersonated_by"),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export type Session = typeof session.$inferSelect;

export const account = sqliteTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: integer("access_token_expires_at", {
            mode: "timestamp_ms",
        }),
        refreshTokenExpiresAt: integer("refresh_token_expires_at", {
            mode: "timestamp_ms",
        }),
        scope: text("scope"),
        password: text("password"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export type Account = typeof account.$inferSelect;

export const verification = sqliteTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export type Verification = typeof verification.$inferSelect;

export const organization = sqliteTable(
    "organization",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        logo: text("logo"),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
        metadata: text("metadata"),
    },
    (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export type Organization = typeof organization.$inferSelect;

export const member = sqliteTable(
    "member",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        role: text("role").default("member").notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    },
    (table) => [
        index("member_organizationId_idx").on(table.organizationId),
        index("member_userId_idx").on(table.userId),
        uniqueIndex("member_org_user_uidx").on(table.organizationId, table.userId),
    ],
);

export type Member = typeof member.$inferSelect;

export const invitation = sqliteTable(
    "invitation",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        email: text("email").notNull(),
        role: text("role"),
        status: text("status").default("pending").notNull(),
        expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        inviterId: text("inviter_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [
        index("invitation_organizationId_idx").on(table.organizationId),
        index("invitation_email_idx").on(table.email),
    ],
);

export type Invitation = typeof invitation.$inferSelect;

export const upload = sqliteTable(
    "upload",
    {
        id: text("id").primaryKey(),
        originalName: text("original_name").notNull(),
        bucketKey: text("bucket_key").notNull(),
        url: text("url").notNull(),
        fileSize: integer("file_size").notNull(),
        contentType: text("content_type").notNull(),
        status: text("status", { enum: ["pending", "completed", "failed"] }).default("pending").notNull(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        uploadedBy: text("uploaded_by")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("upload_organizationId_idx").on(table.organizationId),
        index("upload_uploadedBy_idx").on(table.uploadedBy),
    ]
);

export type Upload = typeof upload.$inferSelect;

export const media = sqliteTable(
    "media",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        mimeType: text("mime_type").notNull(), // 'video/mp4' | 'audio/mpeg'
        mediaUrl: text("media_url").notNull(),
        coverArtUrl: text("cover_art_url"),
        playCount: integer("play_count").default(0).notNull(),
        uploadedBy: text("uploaded_by")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
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

export const playlist = sqliteTable(
    "playlist",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        coverArtUrl: text("cover_art_url"),
        createdBy: text("created_by")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
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

export type Playlist = typeof playlist.$inferSelect;

export const playlistMedia = sqliteTable(
    "playlist_media",
    {
        playlistId: text("playlist_id")
            .notNull()
            .references(() => playlist.id, { onDelete: "cascade" }),
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

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    members: many(member),
    invitations: many(invitation),
    uploads: many(upload),
    media: many(media),
    playlists: many(playlist),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
    members: many(member),
    invitations: many(invitation),
    uploads: many(upload),
    media: many(media),
    playlists: many(playlist),
    scheduledSessions: many(scheduledSession),
}));

export const memberRelations = relations(member, ({ one }) => ({
    organization: one(organization, {
        fields: [member.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [member.userId],
        references: [user.id],
    }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
    organization: one(organization, {
        fields: [invitation.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [invitation.inviterId],
        references: [user.id],
    }),
}));

export const uploadRelations = relations(upload, ({ one }) => ({
    organization: one(organization, {
        fields: [upload.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [upload.uploadedBy],
        references: [user.id],
    }),
}));

export const mediaRelations = relations(media, ({ one, many }) => ({
    organization: one(organization, {
        fields: [media.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [media.uploadedBy],
        references: [user.id],
    }),
    playlistMedia: many(playlistMedia),
}));

export const playlistRelations = relations(playlist, ({ one, many }) => ({
    organization: one(organization, {
        fields: [playlist.organizationId],
        references: [organization.id],
    }),
    creator: one(user, {
        fields: [playlist.createdBy],
        references: [user.id],
    }),
    playlistMedia: many(playlistMedia),
}));

export const playlistMediaRelations = relations(playlistMedia, ({ one }) => ({
    playlist: one(playlist, {
        fields: [playlistMedia.playlistId],
        references: [playlist.id],
    }),
    media: one(media, {
        fields: [playlistMedia.mediaId],
        references: [media.id],
    }),
}));

export const scheduledSession = sqliteTable(
    "scheduled_session",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        startTime: integer("start_time", { mode: "timestamp_ms" }).notNull(),
        durationMinutes: integer("duration_minutes").notNull(),
        status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).default("scheduled").notNull(),
        seriesId: text("series_id"),
        recurrenceRule: text("recurrence_rule"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("scheduled_session_organizationId_idx").on(table.organizationId),
        index("scheduled_session_seriesId_idx").on(table.seriesId)
    ]
);

export type ScheduledSession = typeof scheduledSession.$inferSelect;

export const scheduledSessionParticipant = sqliteTable(
    "scheduled_session_participant",
    {
        sessionId: text("session_id")
            .notNull()
            .references(() => scheduledSession.id, { onDelete: "cascade" }),
        memberId: text("member_id")
            .notNull()
            .references(() => member.id, { onDelete: "cascade" }),
        joinedAt: integer("joined_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        absent: integer("absent", { mode: "boolean" }).default(false).notNull(),
        absenceReason: text("absence_reason"),
        notes: text("notes"),
    },
    (table) => [
        primaryKey({ columns: [table.sessionId, table.memberId] }),
        index("scheduled_session_participant_sessionId_idx").on(table.sessionId),
        index("scheduled_session_participant_memberId_idx").on(table.memberId),
    ]
);

export type ScheduledSessionParticipant = typeof scheduledSessionParticipant.$inferSelect;

export const scheduledSessionRelations = relations(scheduledSession, ({ one, many }) => ({
    organization: one(organization, {
        fields: [scheduledSession.organizationId],
        references: [organization.id],
    }),
    participants: many(scheduledSessionParticipant),
}));

export const scheduledSessionParticipantRelations = relations(scheduledSessionParticipant, ({ one }) => ({
    session: one(scheduledSession, {
        fields: [scheduledSessionParticipant.sessionId],
        references: [scheduledSession.id],
    }),
    member: one(member, {
        fields: [scheduledSessionParticipant.memberId],
        references: [member.id],
    }),
}));
