import { BadRequestError } from "@api/errors/app.error";
import type { SessionScheduleRepository } from "@api/repositories/session-schedule.repository";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCIES } from "@shared";
import { resolveOverdraftLimit } from "@shared/utils/billing";
import { addDays, addMonths, addWeeks } from "date-fns";
import { nanoid } from "nanoid";
import { BaseService } from "./base.service";
import type { FinanceBillingPlansService } from "./financial/finance-billing-plans.service";
import type { FinanceWalletService } from "./financial/finance-wallet.service";
import type { SessionPaymentService } from "./financial/session-payment.service";

export type CreateSessionDTO = {
    title: string;
    description?: string | null;
    startTime: number;
    durationMinutes: number;
    userIds: string[];
    recurrence?: {
        frequency: "daily" | "weekly" | "biweekly" | "monthly";
        count: number;
    };
};

export type UpdateSessionDTO = {
    title: string;
    description?: string | null;
    startTime: number;
    durationMinutes: number;
    userIds: string[];
    updateForward: boolean;
    status?: "scheduled" | "completed" | "cancelled";
};

export class SessionScheduleService extends BaseService {
    constructor(
        private readonly sessionRepo: SessionScheduleRepository,
        private readonly billingPlansService: FinanceBillingPlansService,
        private readonly walletService: FinanceWalletService,
        private readonly sessionPaymentService: SessionPaymentService,
        private readonly auditRepo: SystemAuditRepository
    ) {
        super();
    }

    private calculateNextOccurrence(startTime: number, frequency: string, offset: number): number {
        const date = new Date(startTime);
        switch (frequency.toLowerCase()) {
            case "daily":
                return addDays(date, offset).getTime();
            case "weekly":
                return addWeeks(date, offset).getTime();
            case "biweekly":
                return addWeeks(date, offset * 2).getTime();
            case "monthly":
                return addMonths(date, offset).getTime();
            default:
                return startTime;
        }
    }

    async createSession(organizationId: string, data: CreateSessionDTO) {
        const isRecurring = !!data.recurrence;
        const seriesId = isRecurring ? nanoid() : null;
        const count = isRecurring ? (data.recurrence?.count ?? 1) : 1;
        const recurrenceRule = isRecurring
            ? `FREQ=${data.recurrence?.frequency.toUpperCase()};COUNT=${count}`
            : null;

        const sessionsToInsert = Array.from({ length: count }).map((_, i) => ({
            id: nanoid(),
            organizationId,
            title: data.title,
            description: data.description ?? null,
            startTime: new Date(
                isRecurring && data.recurrence
                    ? this.calculateNextOccurrence(data.startTime, data.recurrence.frequency, i)
                    : data.startTime
            ),
            durationMinutes: data.durationMinutes,
            status: "scheduled" as const,
            seriesId,
            recurrenceRule,
        }));

        const createdSessions = await this.sessionRepo.createSessions(sessionsToInsert);

        const attendancesToInsert = createdSessions.flatMap((session) =>
            data.userIds.map((userId) => ({
                sessionId: session.id,
                organizationId,
                userId,
            }))
        );

        if (attendancesToInsert.length > 0) {
            await this.sessionRepo.addAttendances(attendancesToInsert);
        }

        return createdSessions;
    }

    async findSessionsByOrganization(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        limit: number = 25,
        cursor?: string,
        direction: "next" | "prev" = "next",
        search?: string
    ) {
        return await this.sessionRepo.findSessionsByOrganization(
            organizationId,
            startDate,
            endDate,
            limit,
            cursor,
            direction,
            search
        );
    }

    async findSessionById(organizationId: string, sessionId: string) {
        return await this.sessionRepo.findSessionById(organizationId, sessionId);
    }

    async getSessionById(organizationId: string, sessionId: string) {
        const session = await this.findSessionById(organizationId, sessionId);
        return this.assertExists(session, `Session ${sessionId} not found`);
    }

    async getScheduleMetrics(organizationId: string, startDate?: number, endDate?: number) {
        return this.sessionRepo.findScheduleMetricsByOrganization(
            organizationId,
            startDate,
            endDate
        );
    }

    async getAnalyticsSessions(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        tzOffset?: string
    ) {
        return this.sessionRepo.findSessionTrendsByOrganization(
            organizationId,
            startDate,
            endDate,
            tzOffset
        );
    }

    async getAnalyticsAttendance(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        tzOffset?: string
    ) {
        return this.sessionRepo.findAttendanceTrendsByOrganization(
            organizationId,
            startDate,
            endDate,
            tzOffset
        );
    }

    async updateSessionStatus(
        organizationId: string,
        sessionId: string,
        status: "scheduled" | "completed" | "cancelled"
    ) {
        const result = await this.sessionRepo.updateSessionStatus(
            organizationId,
            sessionId,
            status
        );

        if (status === "completed") {
            const session = await this.sessionRepo.findSessionById(organizationId, sessionId);
            if (!session) return result;

            // Fetch attendances to know who to bill
            const attendances = await this.sessionRepo.findAttendancesBySessionId(sessionId);
            const activeParticipantCount = attendances.filter((a) => !a.absent).length;
            const currencyId = FINANCIAL_CURRENCIES.CNY; // Default to CNY for now

            for (const attendance of attendances) {
                if (attendance.absent) continue; // Don't bill if absent

                // IDEMPOTENCY GUARD: paymentStatus is set atomically to "paid" by
                // processSessionPayment() in the same db.batch() as the transaction.
                // If already paid or refunded, skip — prevents double charging on
                // repeated calls (e.g. UI tab switching re-firing the endpoint).
                if (
                    attendance.paymentStatus === "paid" ||
                    attendance.paymentStatus === "refunded"
                ) {
                    continue;
                }

                const rate = await this.billingPlansService.resolveBillingPlanRate(
                    attendance.userId,
                    organizationId,
                    currencyId,
                    activeParticipantCount
                );

                if (rate > 0) {
                    await this.chargeAttendance(
                        organizationId,
                        session,
                        attendance.userId,
                        rate,
                        activeParticipantCount
                    );
                }
            }
        }

        return result;
    }

    /**
     * Delegates atomic payment processing to SessionPaymentService.
     * Handles business failures (insufficient funds) by writing to the audit log.
     */
    private async chargeAttendance(
        organizationId: string,
        session: { id: string; title: string; durationMinutes: number; startTime: Date },
        userId: string,
        rateCentsPerMinute: number,
        participantCount: number
    ) {
        const amountCents = rateCentsPerMinute * session.durationMinutes;
        const currencyId = FINANCIAL_CURRENCIES.CNY;

        try {
            // 1. Pre-charge overdraft warning check (consistency with resolveOverdraftLimit)
            const account = await this.walletService.getWallet(userId, organizationId, currencyId);
            const plan = await this.billingPlansService.getMemberBillingPlan(
                userId,
                organizationId,
                currencyId
            );

            const overdraftLimit = resolveOverdraftLimit(account, plan);
            const isApproachingOverdraft =
                account.balanceCents - amountCents <= -overdraftLimit * 0.9;

            if (isApproachingOverdraft) {
                await this.auditRepo.insert({
                    id: `aud_${nanoid()}`,
                    organizationId,
                    eventType: "payment.overdraft_limit_approached",
                    severity: "warning",
                    subjectType: "user",
                    subjectId: userId,
                    message: `Member ${userId} is approaching their overdraft limit of ${overdraftLimit} cents.`,
                    metadata: JSON.stringify({
                        balanceCents: account.balanceCents,
                        overdraftLimitCents: overdraftLimit,
                    }),
                });
            }

            const orgFunding = await this.walletService.getOrgFunding(organizationId, currencyId);

            // 2. Delegate atomic batch debit
            await this.sessionPaymentService.processSessionPayment({
                organizationId,
                sessionId: session.id,
                userId,
                amountCents,
                currencyId,
                sourceAccountId: account.id,
                destinationAccountId: orgFunding.id,
                categoryId: FINANCIAL_CATEGORIES.SERVICE_FEE,
                performedBy: null,
                note: `Session Fee: ${session.title} (${rateCentsPerMinute} cents/min x ${session.durationMinutes} min, ${participantCount} students)`,
            });
        } catch (error) {
            if (error instanceof BadRequestError) {
                // Business failure (e.g., Insufficient funds even with overdraft)
                await this.auditRepo.insert({
                    id: `aud_${nanoid()}`,
                    organizationId,
                    eventType: "payment.missed",
                    severity: "warning",
                    subjectType: "session_attendance",
                    subjectId: `${session.id}:${userId}`,
                    message: `Failed to collect payment for ${userId} in session ${session.id}: ${error.message}`,
                    metadata: JSON.stringify({
                        error: error.message,
                        amountCents,
                        currencyId,
                        sessionId: session.id,
                        userId,
                    }),
                });
                return;
            }
            // Unexpected infrastructure errors bubble up
            throw error;
        }
    }

    async updateSession(organizationId: string, sessionId: string, data: UpdateSessionDTO) {
        const currentSession = await this.getSessionById(organizationId, sessionId);

        if (!data.updateForward || !currentSession.seriesId) {
            await this.sessionRepo.updateSessionDetails(organizationId, sessionId, {
                title: data.title,
                description: data.description || null,
                startTime: new Date(data.startTime),
                durationMinutes: data.durationMinutes,
            });

            await this.sessionRepo.deleteAllSessionAttendances(sessionId);
            if (data.userIds.length > 0) {
                await this.sessionRepo.addAttendances(
                    data.userIds.map((userId) => ({ sessionId, organizationId, userId }))
                );
            }

            if (data.status) {
                await this.updateSessionStatus(organizationId, sessionId, data.status);
            }
        } else {
            const deletedFutureSessions = await this.sessionRepo.deleteFollowingSessions(
                currentSession.seriesId,
                currentSession.startTime
            );
            const remainingCount = deletedFutureSessions.length;

            if (remainingCount > 0) {
                const recurrenceRule = currentSession.recurrenceRule || "";
                let frequency = "weekly";
                if (recurrenceRule.includes("DAILY")) frequency = "daily";
                if (recurrenceRule.includes("BIWEEKLY")) frequency = "biweekly";
                if (recurrenceRule.includes("MONTHLY")) frequency = "monthly";

                const sessionsToInsert = [];
                for (let i = 0; i < remainingCount; i++) {
                    const sessionStartTime = this.calculateNextOccurrence(
                        data.startTime,
                        frequency,
                        i
                    );

                    sessionsToInsert.push({
                        id: nanoid(),
                        organizationId,
                        title: data.title,
                        description: data.description ?? null,
                        startTime: new Date(sessionStartTime),
                        durationMinutes: data.durationMinutes,
                        status: "scheduled" as const,
                        seriesId: currentSession.seriesId,
                        recurrenceRule: currentSession.recurrenceRule,
                    });
                }

                const createdSessions = await this.sessionRepo.createSessions(sessionsToInsert);

                const attendancesToInsert = [];
                for (const session of createdSessions) {
                    for (const userId of data.userIds) {
                        attendancesToInsert.push({
                            sessionId: session.id,
                            organizationId,
                            userId,
                        });
                    }
                }

                if (attendancesToInsert.length > 0) {
                    await this.sessionRepo.addAttendances(attendancesToInsert);
                }
            }

            if (data.status) {
                await this.updateSessionStatus(organizationId, sessionId, data.status);
            }
        }

        return { success: true };
    }

    async updateAttendance(
        organizationId: string,
        sessionId: string,
        attendances: {
            userId: string;
            absent: boolean;
            absenceReason?: string | null;
            notes?: string | null;
        }[]
    ) {
        await this.getSessionById(organizationId, sessionId);

        if (attendances.length > 0) {
            await this.sessionRepo.updateAttendance(sessionId, attendances);
        }

        return { success: true };
    }

    async deleteSession(organizationId: string, sessionId: string, deleteForward: boolean) {
        const currentSession = await this.getSessionById(organizationId, sessionId);

        if (!deleteForward || !currentSession.seriesId) {
            await this.sessionRepo.deleteSessionSingle(organizationId, sessionId);
        } else {
            await this.sessionRepo.deleteFollowingSessions(
                currentSession.seriesId,
                currentSession.startTime
            );
        }

        return { success: true };
    }
}
