import type { AppContext } from "@api/helpers/types.helpers";
import { DashboardRepository } from "@api/repositories/dashboard.repository";
import { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import { FinancialOrgSettingsRepository } from "@api/repositories/financial/financial-org-settings.repository";
import { FinancialTransactionCategoriesRepository } from "@api/repositories/financial/financial-transaction-categories.repository";
import { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { MediaRepository } from "@api/repositories/media.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { PlaylistRepository } from "@api/repositories/playlist.repository";
import { ScheduledSessionsRepository } from "@api/repositories/scheduled-sessions.repository";
import { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import { SessionScheduleRepository } from "@api/repositories/session-schedule.repository";
import { SocialMediaRepository } from "@api/repositories/social-media.repository";
import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { UploadRepository, UserUploadRepository } from "@api/repositories/upload.repository";
import { UserRepository } from "@api/repositories/user.repository";
import { UserProfileRepository } from "@api/repositories/user-profile.repository";
import { getDbClient } from "./db.factory";

export const getFinancialAccountsRepository = (ctx: AppContext) => {
    return new FinancialAccountsRepository(getDbClient(ctx));
};

export const getFinanceBillingPlansRepository = (ctx: AppContext) => {
    return new FinanceBillingPlansRepository(getDbClient(ctx));
};

export const getFinancialCurrenciesRepository = (ctx: AppContext) => {
    return new FinancialCurrenciesRepository(getDbClient(ctx));
};

export const getFinancialOrgSettingsRepository = (ctx: AppContext) => {
    return new FinancialOrgSettingsRepository(getDbClient(ctx));
};

export const getFinancialTransactionCategoriesRepository = (ctx: AppContext) => {
    return new FinancialTransactionCategoriesRepository(getDbClient(ctx));
};

export const getFinancialTransactionsRepository = (ctx: AppContext) => {
    return new FinancialTransactionsRepository(getDbClient(ctx));
};

export const getUserRepository = (ctx: AppContext) => {
    return new UserRepository(getDbClient(ctx));
};

export const getUserProfileRepository = (ctx: AppContext) => {
    return new UserProfileRepository(getDbClient(ctx));
};

export const getSocialMediaRepository = (ctx: AppContext) => {
    return new SocialMediaRepository(getDbClient(ctx));
};

export const getOrganizationRepository = (ctx: AppContext) => {
    return new OrganizationRepository(getDbClient(ctx));
};

export const getMemberRepository = (ctx: AppContext) => {
    return new MemberRepository(getDbClient(ctx));
};

export const getUploadRepository = (ctx: AppContext) => {
    return new UploadRepository(getDbClient(ctx));
};

export const getUserUploadRepository = (ctx: AppContext) => {
    return new UserUploadRepository(getDbClient(ctx));
};

export const getMediaRepository = (ctx: AppContext) => {
    return new MediaRepository(getDbClient(ctx));
};

export const getPlaylistRepository = (ctx: AppContext) => {
    return new PlaylistRepository(getDbClient(ctx));
};

export const getSessionScheduleRepository = (ctx: AppContext) => {
    return new SessionScheduleRepository(getDbClient(ctx));
};

export const getDashboardRepository = (ctx: AppContext) => {
    return new DashboardRepository(getDbClient(ctx));
};

export const getScheduledSessionsRepository = (ctx: AppContext) => {
    return new ScheduledSessionsRepository(getDbClient(ctx));
};

export const getSessionAttendancesRepository = (ctx: AppContext) => {
    return new SessionAttendancesRepository(getDbClient(ctx));
};

export const getPaymentQueueRepository = (ctx: AppContext) => {
    return new PaymentQueueRepository(getDbClient(ctx));
};

export const getSystemAuditRepository = (ctx: AppContext) => {
    return new SystemAuditRepository(getDbClient(ctx));
};
