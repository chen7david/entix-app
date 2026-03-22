import { relations } from "drizzle-orm";
import { authUsers, authSessions, authAccounts } from "./auth.schema";
import { authOrganizations, authMembers, authInvitations } from "./organization.schema";
import { uploads, media, playlists, playlistMedia } from "./media.schema";
import { scheduledSessions, sessionAttendances } from "./schedule.schema";

export const authUsersRelations = relations(authUsers, ({ many }) => ({
    sessions: many(authSessions),
    accounts: many(authAccounts),
    members: many(authMembers),
    invitations: many(authInvitations),
    uploads: many(uploads),
    media: many(media),
    playlists: many(playlists),
    attendances: many(sessionAttendances),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
    user: one(authUsers, {
        fields: [authSessions.userId],
        references: [authUsers.id],
    }),
}));

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
    user: one(authUsers, {
        fields: [authAccounts.userId],
        references: [authUsers.id],
    }),
}));

export const authOrganizationsRelations = relations(authOrganizations, ({ many }) => ({
    members: many(authMembers),
    invitations: many(authInvitations),
    uploads: many(uploads),
    media: many(media),
    playlists: many(playlists),
    scheduledSessions: many(scheduledSessions),
}));

export const authMembersRelations = relations(authMembers, ({ one }) => ({
    organization: one(authOrganizations, {
        fields: [authMembers.organizationId],
        references: [authOrganizations.id],
    }),
    user: one(authUsers, {
        fields: [authMembers.userId],
        references: [authUsers.id],
    }),
}));

export const authInvitationsRelations = relations(authInvitations, ({ one }) => ({
    organization: one(authOrganizations, {
        fields: [authInvitations.organizationId],
        references: [authOrganizations.id],
    }),
    inviter: one(authUsers, {
        fields: [authInvitations.inviterId],
        references: [authUsers.id],
    }),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
    organization: one(authOrganizations, {
        fields: [uploads.organizationId],
        references: [authOrganizations.id],
    }),
    uploadedBy: one(authUsers, {
        fields: [uploads.uploadedBy],
        references: [authUsers.id],
    }),
}));

export const mediaRelations = relations(media, ({ one, many }) => ({
    organization: one(authOrganizations, {
        fields: [media.organizationId],
        references: [authOrganizations.id],
    }),
    uploadedBy: one(authUsers, {
        fields: [media.uploadedBy],
        references: [authUsers.id],
    }),
    playlistMedia: many(playlistMedia),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
    organization: one(authOrganizations, {
        fields: [playlists.organizationId],
        references: [authOrganizations.id],
    }),
    creator: one(authUsers, {
        fields: [playlists.createdBy],
        references: [authUsers.id],
    }),
    playlistMedia: many(playlistMedia),
}));

export const playlistMediaRelations = relations(playlistMedia, ({ one }) => ({
    playlist: one(playlists, {
        fields: [playlistMedia.playlistId],
        references: [playlists.id],
    }),
    media: one(media, {
        fields: [playlistMedia.mediaId],
        references: [media.id],
    }),
}));

export const scheduledSessionsRelations = relations(scheduledSessions, ({ one, many }) => ({
    organization: one(authOrganizations, {
        fields: [scheduledSessions.organizationId],
        references: [authOrganizations.id],
    }),
    attendances: many(sessionAttendances),
}));

export const sessionAttendancesRelations = relations(sessionAttendances, ({ one }) => ({
    session: one(scheduledSessions, {
        fields: [sessionAttendances.sessionId],
        references: [scheduledSessions.id],
    }),
    organization: one(authOrganizations, {
        fields: [sessionAttendances.organizationId],
        references: [authOrganizations.id],
    }),
    user: one(authUsers, {
        fields: [sessionAttendances.userId],
        references: [authUsers.id],
    }),
}));
