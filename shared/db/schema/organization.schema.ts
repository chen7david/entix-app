import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema"; // Import correctly explicitly

export const authOrganizations = sqliteTable(
    "auth_organizations",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        logo: text("logo"),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
        metadata: text("metadata"),
    },
    (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)]
);

export type AuthOrganization = typeof authOrganizations.$inferSelect;
export type NewAuthOrganization = typeof authOrganizations.$inferInsert;

export const authMembers = sqliteTable(
    "auth_members",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        role: text("role").default("member").notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    },
    (table) => [
        index("member_organizationId_idx").on(table.organizationId),
        index("member_userId_idx").on(table.userId),
        uniqueIndex("member_org_user_uidx").on(table.organizationId, table.userId),
    ]
);

export type AuthMember = typeof authMembers.$inferSelect;
export type NewAuthMember = typeof authMembers.$inferInsert;

export const authInvitations = sqliteTable(
    "auth_invitations",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        email: text("email").notNull(),
        role: text("role"),
        status: text("status").default("pending").notNull(),
        expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        inviterId: text("inviter_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
    },
    (table) => [
        index("invitation_organizationId_idx").on(table.organizationId),
        index("invitation_email_idx").on(table.email),
    ]
);

export type AuthInvitation = typeof authInvitations.$inferSelect;
export type NewAuthInvitation = typeof authInvitations.$inferInsert;
