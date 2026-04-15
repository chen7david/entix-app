import { DbBatchRunner } from "@api/helpers/batch-runner";
import type { AppContext } from "@api/helpers/types.helpers";
import { auth } from "@api/lib/auth/auth";
import { AvatarService } from "@api/services/avatar.service";
import { CacheService } from "@api/services/cache.service";
import { DashboardService } from "@api/services/dashboard.service";
import { AdminFinancialService } from "@api/services/financial/admin-financial.service";
import { FinanceBillingPlansService } from "@api/services/financial/finance-billing-plans.service";
import { FinanceWalletService } from "@api/services/financial/finance-wallet.service";
import { OrgFinancialService } from "@api/services/financial/org-financial.service";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { UserFinancialService } from "@api/services/financial/user-financial.service";
import { MailService } from "@api/services/mailer.service";
import { MediaService } from "@api/services/media.service";
import { MemberService } from "@api/services/member.service";
import { MemberExportService } from "@api/services/member-export.service";
import { MemberImportService } from "@api/services/member-import.service";
import { NotificationService } from "@api/services/notification.service";
import { OrganizationService } from "@api/services/organization.service";
import { PaymentQueueService } from "@api/services/payment/payment-queue.service";
import { PlaylistService } from "@api/services/playlist.service";
import { RegistrationService } from "@api/services/registration.service";
import { SessionScheduleService } from "@api/services/session-schedule.service";
import { SocialMediaService } from "@api/services/social-media.service";
import { UserService } from "@api/services/user.service";
import { UserProfileService } from "@api/services/user-profile.service";
import { getDbClient } from "./db.factory";
import {
    getDashboardRepository,
    getFinanceBillingPlansRepository,
    getFinancialAccountsRepository,
    getFinancialCurrenciesRepository,
    getFinancialOrgSettingsRepository,
    getFinancialTransactionsRepository,
    getKvCacheRepository,
    getMediaRepository,
    getMemberRepository,
    getOrganizationRepository,
    getPaymentQueueRepository,
    getPlaylistRepository,
    getSessionAttendancesRepository,
    getSessionScheduleRepository,
    getSocialMediaRepository,
    getSystemAuditRepository,
    getUserProfileRepository,
    getUserRepository,
} from "./repository.factory";
import { getUploadService } from "./upload.factory";

export const getUserService = (ctx: AppContext) => {
    return new UserService(getUserRepository(ctx), auth(ctx));
};

export const getNotificationService = (ctx: AppContext) => {
    return new NotificationService(getUserRepository(ctx), auth(ctx));
};

export const getUserProfileService = (ctx: AppContext) => {
    return new UserProfileService(getUserProfileRepository(ctx));
};

export const getSocialMediaService = (ctx: AppContext) => {
    return new SocialMediaService(getSocialMediaRepository(ctx));
};

export const getAvatarService = (ctx: AppContext) => {
    return new AvatarService(getUserRepository(ctx), getUploadService(ctx));
};

export const getRegistrationService = (ctx: AppContext) => {
    return new RegistrationService(
        getUserRepository(ctx),
        getOrganizationRepository(ctx),
        getMemberRepository(ctx),
        getUserFinancialService(ctx),
        getUserService(ctx),
        ctx.var.frontendUrl,
        ctx.var.logger
    );
};

export const getOrganizationService = (ctx: AppContext) => {
    return new OrganizationService(getOrganizationRepository(ctx));
};

export const getMailService = (ctx: AppContext) => {
    return new MailService(ctx.env.RESEND_API_KEY);
};

export const getMediaService = (ctx: AppContext) => {
    return new MediaService(getMediaRepository(ctx), getUploadService(ctx));
};

export const getPlaylistService = (ctx: AppContext) => {
    return new PlaylistService(getPlaylistRepository(ctx), getUploadService(ctx));
};

export const getSessionScheduleService = (ctx: AppContext) => {
    return new SessionScheduleService(
        getSessionScheduleRepository(ctx),
        getFinanceBillingPlansService(ctx),
        getFinanceWalletService(ctx),
        getPaymentQueueService(ctx),
        getSystemAuditRepository(ctx)
    );
};

export const getMemberService = (ctx: AppContext) => {
    return new MemberService(getMemberRepository(ctx));
};

export const getDashboardService = (ctx: AppContext) => {
    return new DashboardService(getDashboardRepository(ctx));
};

export const getMemberExportService = (ctx: AppContext) => {
    return new MemberExportService(getMemberRepository(ctx));
};

export const getMemberImportService = (ctx: AppContext) => {
    return new MemberImportService(
        getUserRepository(ctx),
        getMemberRepository(ctx),
        getUserProfileRepository(ctx),
        getSocialMediaRepository(ctx)
    );
};

export const getOrgFinancialService = (ctx: AppContext) => {
    return new OrgFinancialService(
        getFinancialAccountsRepository(ctx),
        getFinancialTransactionsRepository(ctx),
        getFinancialCurrenciesRepository(ctx)
    );
};

export const getUserFinancialService = (ctx: AppContext) => {
    return new UserFinancialService(
        getFinancialAccountsRepository(ctx),
        getFinancialTransactionsRepository(ctx),
        getFinancialCurrenciesRepository(ctx),
        getFinancialOrgSettingsRepository(ctx)
    );
};

export const getAdminFinancialService = (ctx: AppContext) => {
    return new AdminFinancialService(
        getFinancialAccountsRepository(ctx),
        getFinancialTransactionsRepository(ctx)
    );
};

export const getFinanceBillingPlansService = (ctx: AppContext) => {
    return new FinanceBillingPlansService(getFinanceBillingPlansRepository(ctx));
};

export const getFinanceWalletService = (ctx: AppContext) => {
    return new FinanceWalletService(
        getFinancialAccountsRepository(ctx),
        getFinancialTransactionsRepository(ctx)
    );
};

export const getSessionPaymentService = (ctx: AppContext) => {
    const db = getDbClient(ctx);
    return new SessionPaymentService(
        new DbBatchRunner(db),
        getFinancialTransactionsRepository(ctx),
        getSessionAttendancesRepository(ctx),
        getPaymentQueueRepository(ctx),
        getSystemAuditRepository(ctx),
        getFinancialAccountsRepository(ctx),
        getFinanceBillingPlansRepository(ctx)
    );
};

export const getPaymentQueueService = (ctx: AppContext) => {
    return new PaymentQueueService(getPaymentQueueRepository(ctx), ctx.env.QUEUE);
};

export const getCacheService = (ctx: AppContext) => {
    return new CacheService(getKvCacheRepository(ctx));
};
