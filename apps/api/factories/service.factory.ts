import { DbBatchRunner } from "@api/helpers/batch-runner";
import type { AppContext } from "@api/helpers/types.helpers";
import { auth } from "@api/lib/auth/auth";
import { AdminFinancialService } from "@api/services/financial/admin-financial.service";
import { FinanceBillingPlansService } from "@api/services/financial/finance-billing-plans.service";
import { FinanceWalletService } from "@api/services/financial/finance-wallet.service";
import { OrgFinancialService } from "@api/services/financial/org-financial.service";
import { ReconciliationService } from "@api/services/financial/reconciliation.service";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { UserFinancialService } from "@api/services/financial/user-financial.service";
import { AdminAuditService } from "@api/services/infra/admin-audit.service";
import { CacheService } from "@api/services/infra/cache.service";
import { MailService } from "@api/services/infra/mailer.service";
import { NotificationService } from "@api/services/infra/notification.service";
import { LessonService } from "@api/services/lessons/lesson.service";
import { LessonContentService } from "@api/services/lessons/lesson-content.service";
import { MediaService } from "@api/services/media/media.service";
import { PlaylistService } from "@api/services/media/playlist.service";
import { parseGoogleTtsCredentials, TtsService } from "@api/services/media/tts.service";
import { MemberService } from "@api/services/members/member.service";
import { MemberAccountService } from "@api/services/members/member-account.service";
import { MemberExportService } from "@api/services/members/member-export.service";
import { MemberImportService } from "@api/services/members/member-import.service";
import { RegistrationService } from "@api/services/members/registration.service";
import { DashboardService } from "@api/services/org/dashboard.service";
import { OrganizationService } from "@api/services/org/organization.service";
import { PaymentQueueService } from "@api/services/payment/payment-queue.service";
import { EnrollmentService } from "@api/services/schedule/enrollment.service";
import { SessionScheduleService } from "@api/services/schedule/session-schedule.service";
import { AvatarService } from "@api/services/users/avatar.service";
import { SocialMediaService } from "@api/services/users/social-media.service";
import { UserService } from "@api/services/users/user.service";
import { UserProfileService } from "@api/services/users/user-profile.service";
import { VocabularyService } from "@api/services/vocabulary/vocabulary.service";
import { getBucketClient } from "./bucket.factory";
import { getDbClient } from "./db.factory";
import { getPassageService } from "./passage.factory";
import {
    getDashboardRepository,
    getFinanceBillingPlansRepository,
    getFinancialAccountsRepository,
    getFinancialCurrenciesRepository,
    getFinancialOrgSettingsRepository,
    getFinancialTransactionCategoriesRepository,
    getFinancialTransactionsRepository,
    getKvCacheRepository,
    getLessonContentRepository,
    getLessonRepository,
    getMediaRepository,
    getMemberRepository,
    getOrganizationRepository,
    getPaymentQueueRepository,
    getPlaylistRepository,
    getScheduledSessionsRepository,
    getSessionAttendancesRepository,
    getSessionScheduleRepository,
    getSocialMediaRepository,
    getStudentVocabularyRepository,
    getSystemAuditRepository,
    getUserProfileRepository,
    getUserRepository,
    getVocabularyBankRepository,
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
        getFinanceBillingPlansService(ctx),
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

export const getLessonService = (ctx: AppContext) => {
    return new LessonService(getLessonRepository(ctx), getUploadService(ctx));
};

export const getLessonContentService = (ctx: AppContext) => {
    return new LessonContentService(
        getLessonRepository(ctx),
        getLessonContentRepository(ctx),
        getPassageService(ctx)
    );
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
        getScheduledSessionsRepository(ctx),
        getMemberRepository(ctx),
        getFinanceBillingPlansService(ctx),
        getFinanceWalletService(ctx),
        getPaymentQueueService(ctx),
        getSystemAuditRepository(ctx)
    );
};

export const getEnrollmentService = (ctx: AppContext) => {
    return new EnrollmentService(
        getScheduledSessionsRepository(ctx),
        getSessionAttendancesRepository(ctx),
        getMemberRepository(ctx),
        getSessionScheduleService(ctx)
    );
};

export const getMemberService = (ctx: AppContext) => {
    return new MemberService(getMemberRepository(ctx));
};

export const getMemberAccountService = (ctx: AppContext) => {
    return new MemberAccountService(
        getMemberRepository(ctx),
        getUserRepository(ctx),
        auth(ctx),
        ctx.var.logger
    );
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
        getSocialMediaRepository(ctx),
        getFinanceBillingPlansService(ctx),
        getFinanceWalletService(ctx)
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
        getFinancialTransactionsRepository(ctx),
        getFinancialCurrenciesRepository(ctx),
        getFinancialOrgSettingsRepository(ctx)
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

export const getAdminAuditService = (ctx: AppContext) => {
    return new AdminAuditService(getSystemAuditRepository(ctx), ctx.env.QUEUE);
};

export const getReconciliationService = (ctx: AppContext) => {
    return new ReconciliationService(
        getSystemAuditRepository(ctx),
        getFinancialAccountsRepository(ctx),
        getFinancialTransactionCategoriesRepository(ctx),
        getSessionPaymentService(ctx)
    );
};

export const getCacheService = (ctx: AppContext) => {
    return new CacheService(getKvCacheRepository(ctx));
};

export const getVocabularyService = (ctx: AppContext) => {
    return new VocabularyService(
        getVocabularyBankRepository(ctx),
        getSessionAttendancesRepository(ctx),
        getStudentVocabularyRepository(ctx)
    );
};

export const getTtsService = (ctx: AppContext): TtsService => {
    const credentials = parseGoogleTtsCredentials(ctx.env as unknown as Record<string, unknown>);
    return new TtsService(credentials, getBucketClient(ctx));
};
