import type { SessionScheduleRepository } from "@api/repositories/session-schedule.repository";
import { addDays, addMonths, addWeeks } from "date-fns";
import { nanoid } from "nanoid";
import { BaseService } from "./base.service";

export type CreateSessionDTO = {
    title: string;
    description?: string | null;
    startTime: number;
    durationMinutes: number;
    userIds: string[];
    recurrence?: {
        frequency: "daily" | "weekly" | "monthly";
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
    constructor(private sessionRepo: SessionScheduleRepository) {
        super();
    }

    private calculateNextOccurrence(startTime: number, frequency: string, offset: number): number {
        const date = new Date(startTime);
        switch (frequency.toLowerCase()) {
            case "daily":
                return addDays(date, offset).getTime();
            case "weekly":
                return addWeeks(date, offset).getTime();
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
        return this.sessionRepo.updateSessionStatus(organizationId, sessionId, status);
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
                await this.sessionRepo.updateSessionStatus(organizationId, sessionId, data.status);
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
                await this.sessionRepo.updateSessionStatus(organizationId, sessionId, data.status);
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
