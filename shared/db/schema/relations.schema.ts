import { relations } from "drizzle-orm";
import { authAccounts, authSessions, authUsers } from "./auth.schema";
import {
    financeBillingPlanRates,
    financeBillingPlans,
    financeMemberBillingPlans,
} from "./finance-billing-plans.schema";
import { financialAccounts } from "./financial-accounts.schema";
import { financialCurrencies } from "./financial-currencies.schema";
import { financialSessionPaymentEvents } from "./financial-session-payment-events.schema";
import { financialTransactionCategories } from "./financial-transaction-categories.schema";
import { financialTransactionLines } from "./financial-transaction-lines.schema";
import { financialTransactions } from "./financial-transactions.schema";
import { media, playlistMedia, playlists, uploads, userUploads } from "./media.schema";
import { authInvitations, authMembers, authOrganizations } from "./organization.schema";
import { scheduledSessions, sessionAttendances } from "./schedule.schema";
import { socialMediaTypes, userSocialMedias } from "./social-media.schema";
import { systemAuditEvents } from "./system-audit-events.schema";
import { userAddresses, userPhoneNumbers, userProfiles } from "./user-profiles.schema";

export const authUsersRelations = relations(authUsers, ({ one, many }) => ({
    sessions: many(authSessions),
    accounts: many(authAccounts),
    members: many(authMembers),
    invitations: many(authInvitations),
    uploads: many(uploads),
    userUploads: many(userUploads),
    media: many(media),
    playlists: many(playlists),
    attendances: many(sessionAttendances),
    profile: one(userProfiles),
    phoneNumbers: many(userPhoneNumbers),
    addresses: many(userAddresses),
    socialMedias: many(userSocialMedias),
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

export const userUploadsRelations = relations(userUploads, ({ one }) => ({
    user: one(authUsers, {
        fields: [userUploads.userId],
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

export const sessionAttendancesRelations = relations(sessionAttendances, ({ one, many }) => ({
    session: one(scheduledSessions, {
        fields: [sessionAttendances.sessionId],
        references: [scheduledSessions.id],
    }),
    paymentEvents: many(financialSessionPaymentEvents),
    organization: one(authOrganizations, {
        fields: [sessionAttendances.organizationId],
        references: [authOrganizations.id],
    }),
    user: one(authUsers, {
        fields: [sessionAttendances.userId],
        references: [authUsers.id],
    }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
    user: one(authUsers, {
        fields: [userProfiles.userId],
        references: [authUsers.id],
    }),
}));

export const userPhoneNumbersRelations = relations(userPhoneNumbers, ({ one }) => ({
    user: one(authUsers, {
        fields: [userPhoneNumbers.userId],
        references: [authUsers.id],
    }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
    user: one(authUsers, {
        fields: [userAddresses.userId],
        references: [authUsers.id],
    }),
}));

export const socialMediaTypesRelations = relations(socialMediaTypes, ({ many }) => ({
    userSocialMedias: many(userSocialMedias),
}));

export const userSocialMediasRelations = relations(userSocialMedias, ({ one }) => ({
    user: one(authUsers, {
        fields: [userSocialMedias.userId],
        references: [authUsers.id],
    }),
    socialMediaType: one(socialMediaTypes, {
        fields: [userSocialMedias.socialMediaTypeId],
        references: [socialMediaTypes.id],
    }),
}));

export const financialAccountsRelations = relations(financialAccounts, ({ one, many }) => ({
    currency: one(financialCurrencies, {
        fields: [financialAccounts.currencyId],
        references: [financialCurrencies.id],
    }),
    sourceTransactions: many(financialTransactions, { relationName: "sourceAccount" }),
    destinationTransactions: many(financialTransactions, { relationName: "destinationAccount" }),
    lines: many(financialTransactionLines),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one, many }) => ({
    sourceAccount: one(financialAccounts, {
        fields: [financialTransactions.sourceAccountId],
        references: [financialAccounts.id],
        relationName: "sourceAccount",
    }),
    destinationAccount: one(financialAccounts, {
        fields: [financialTransactions.destinationAccountId],
        references: [financialAccounts.id],
        relationName: "destinationAccount",
    }),
    currency: one(financialCurrencies, {
        fields: [financialTransactions.currencyId],
        references: [financialCurrencies.id],
    }),
    category: one(financialTransactionCategories, {
        fields: [financialTransactions.categoryId],
        references: [financialTransactionCategories.id],
    }),
    lines: many(financialTransactionLines),
}));

export const financialTransactionLinesRelations = relations(
    financialTransactionLines,
    ({ one }) => ({
        transaction: one(financialTransactions, {
            fields: [financialTransactionLines.transactionId],
            references: [financialTransactions.id],
        }),
        account: one(financialAccounts, {
            fields: [financialTransactionLines.accountId],
            references: [financialAccounts.id],
        }),
    })
);

export const financialCurrenciesRelations = relations(financialCurrencies, ({ many }) => ({
    accounts: many(financialAccounts),
    transactions: many(financialTransactions),
}));

export const financialTransactionCategoriesRelations = relations(
    financialTransactionCategories,
    ({ many }) => ({
        transactions: many(financialTransactions),
    })
);

export const financeBillingPlansRelations = relations(financeBillingPlans, ({ one, many }) => ({
    organization: one(authOrganizations, {
        fields: [financeBillingPlans.organizationId],
        references: [authOrganizations.id],
    }),
    currency: one(financialCurrencies, {
        fields: [financeBillingPlans.currencyId],
        references: [financialCurrencies.id],
    }),
    members: many(financeMemberBillingPlans),
    rates: many(financeBillingPlanRates),
}));

export const financeBillingPlanRatesRelations = relations(financeBillingPlanRates, ({ one }) => ({
    plan: one(financeBillingPlans, {
        fields: [financeBillingPlanRates.billingPlanId],
        references: [financeBillingPlans.id],
    }),
}));

export const financeMemberBillingPlansRelations = relations(
    financeMemberBillingPlans,
    ({ one }) => ({
        user: one(authUsers, {
            fields: [financeMemberBillingPlans.userId],
            references: [authUsers.id],
        }),
        organization: one(authOrganizations, {
            fields: [financeMemberBillingPlans.organizationId],
            references: [authOrganizations.id],
        }),
        plan: one(financeBillingPlans, {
            fields: [financeMemberBillingPlans.billingPlanId],
            references: [financeBillingPlans.id],
        }),
        currency: one(financialCurrencies, {
            fields: [financeMemberBillingPlans.currencyId],
            references: [financialCurrencies.id],
        }),
        assignedBy: one(authUsers, {
            fields: [financeMemberBillingPlans.assignedBy],
            references: [authUsers.id],
        }),
    })
);

export const financialSessionPaymentEventsRelations = relations(
    financialSessionPaymentEvents,
    ({ one }) => ({
        session: one(scheduledSessions, {
            fields: [financialSessionPaymentEvents.sessionId],
            references: [scheduledSessions.id],
        }),
        user: one(authUsers, {
            fields: [financialSessionPaymentEvents.userId],
            references: [authUsers.id],
        }),
        transaction: one(financialTransactions, {
            fields: [financialSessionPaymentEvents.transactionId],
            references: [financialTransactions.id],
        }),
    })
);

export const systemAuditEventsRelations = relations(systemAuditEvents, ({ one }) => ({
    organization: one(authOrganizations, {
        fields: [systemAuditEvents.organizationId],
        references: [authOrganizations.id],
    }),
    acknowledgedByUser: one(authUsers, {
        fields: [systemAuditEvents.acknowledgedBy],
        references: [authUsers.id],
    }),
}));
