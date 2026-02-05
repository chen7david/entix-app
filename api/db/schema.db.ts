import { relations, sql } from "drizzle-orm";
import {
    sqliteTable,
    text,
    integer,
    index,
    uniqueIndex,
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
    transactionPin: text("transaction_pin"),
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
    ],
);

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

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    members: many(member),
    invitations: many(invitation),
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

export const financialAccount = sqliteTable(
    "financial_account",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
        currency: text("currency").notNull(),
        type: text("type").notNull(), // LIABILITY, ASSET, REVENUE, EXPENSE, EQUITY
        balance: integer("balance").default(0).notNull(), // Stored in cents
        code: text("code").unique(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("financial_account_org_idx").on(table.organizationId),
        index("financial_account_user_idx").on(table.userId),
    ],
);

export const financialTransaction = sqliteTable(
    "financial_transaction",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        type: text("type").notNull(), // TRANSFER, DEPOSIT, WITHDRAWAL, REVERSAL
        description: text("description").notNull(),
        reference: text("reference"),
        metadata: text("metadata", { mode: "json" }),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [
        index("financial_transaction_org_idx").on(table.organizationId),
    ],
);

export const financialPosting = sqliteTable(
    "financial_posting",
    {
        id: text("id").primaryKey(),
        transactionId: text("transaction_id")
            .notNull()
            .references(() => financialTransaction.id, { onDelete: "cascade" }),
        accountId: text("account_id")
            .notNull()
            .references(() => financialAccount.id, { onDelete: "cascade" }),
        amount: integer("amount").notNull(), // Positive or Negative cents
        description: text("description"),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .notNull(),
    },
    (table) => [
        index("financial_posting_tx_idx").on(table.transactionId),
        index("financial_posting_account_idx").on(table.accountId),
    ],
);

export const financialAccountRelations = relations(financialAccount, ({ one, many }) => ({
    organization: one(organization, {
        fields: [financialAccount.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [financialAccount.userId],
        references: [user.id],
    }),
    postings: many(financialPosting),
}));

export const financialTransactionRelations = relations(financialTransaction, ({ one, many }) => ({
    organization: one(organization, {
        fields: [financialTransaction.organizationId],
        references: [organization.id],
    }),
    postings: many(financialPosting),
}));

export const financialPostingRelations = relations(financialPosting, ({ one }) => ({
    transaction: one(financialTransaction, {
        fields: [financialPosting.transactionId],
        references: [financialTransaction.id],
    }),
    account: one(financialAccount, {
        fields: [financialPosting.accountId],
        references: [financialAccount.id],
    }),
}));
