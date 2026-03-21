import { SessionScheduleRepository } from "@api/repositories/session-schedule.repository";
import { addWeeks } from "date-fns";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";

export type CreateSessionDTO = {
    title: string;
    description?: string | null;
    startTime: number;
    durationMinutes: number;
    memberIds: string[];
    recurrence?: {
        frequency: "weekly";
        count: number;
    };
};

export type UpdateSessionDTO = {
    title: string;
    description?: string | null;
    startTime: number;
    durationMinutes: number;
    memberIds: string[];
    updateForward: boolean;
    status?: "scheduled" | "completed" | "cancelled";
};

export class SessionScheduleService {
    constructor(private sessionRepo: SessionScheduleRepository) {}

    async createSession(organizationId: string, data: CreateSessionDTO) {
        const isRecurring = !!data.recurrence;
        const seriesId = isRecurring ? nanoid() : null;
        const count = isRecurring ? data.recurrence!.count : 1;
        const recurrenceRule = isRecurring ? `FREQ=${data.recurrence!.frequency.toUpperCase()};COUNT=${count}` : null;

        const sessionsToInsert = Array.from({ length: count }).map((_, i) => ({
            id: nanoid(),
            organizationId,
            title: data.title,
            description: data.description ?? null,
            startTime: new Date(isRecurring && data.recurrence!.frequency === "weekly" ? addWeeks(new Date(data.startTime), i).getTime() : data.startTime),
            durationMinutes: data.durationMinutes,
            status: "scheduled" as const,
            seriesId,
            recurrenceRule,
        }));

        const createdSessions = await this.sessionRepo.createSessions(sessionsToInsert);

        const participantsToInsert = createdSessions.flatMap(session => 
            data.memberIds.map(memberId => ({
                sessionId: session.id,
                memberId,
            }))
        );

        if (participantsToInsert.length > 0) {
            await this.sessionRepo.addParticipants(participantsToInsert);
        }

        return createdSessions;
    }

    async getScheduleMetrics(organizationId: string, startDate?: number, endDate?: number) {
        return this.sessionRepo.getScheduleMetricsForOrg(organizationId, startDate, endDate);
    }

    async getAnalyticsSessions(organizationId: string, startDate?: number, endDate?: number, tzOffset?: string) {
        return this.sessionRepo.getSessionTrendsForOrg(organizationId, startDate, endDate, tzOffset);
    }

    async getAnalyticsAttendance(organizationId: string, startDate?: number, endDate?: number, tzOffset?: string) {
        return this.sessionRepo.getAttendanceTrendsForOrg(organizationId, startDate, endDate, tzOffset);
    }

    async updateSessionStatus(organizationId: string, sessionId: string, status: "scheduled" | "completed" | "cancelled") {
        return this.sessionRepo.updateSessionStatus(organizationId, sessionId, status);
    }

    async updateSession(organizationId: string, sessionId: string, data: UpdateSessionDTO) {
        const currentSession = await this.sessionRepo.getSessionById(organizationId, sessionId);
        if (!currentSession) {
            throw new HTTPException(404, { message: "Session not found" });
        }

        if (!data.updateForward || !currentSession.seriesId) {
            // Standard Single Update
            await this.sessionRepo.updateSessionDetails(organizationId, sessionId, {
                title: data.title,
                description: data.description || null,
                startTime: new Date(data.startTime),
                durationMinutes: data.durationMinutes,
            });

            // Patch Participants
            await this.sessionRepo.deleteAllSessionParticipants(sessionId);
            if (data.memberIds.length > 0) {
                await this.sessionRepo.addParticipants(data.memberIds.map(memberId => ({ sessionId, memberId })));
            }

            // Sync Database Status if specifically updated through UI overrides mappings bounds
            if (data.status) {
                await this.sessionRepo.updateSessionStatus(organizationId, sessionId, data.status);
            }
        } else {
            // Recurrence Cascade "Update Forward" Algorithm
            // 1. How many sessions were scheduled to happen AFTER or ON this specific session's old time?
            const deletedFutureSessions = await this.sessionRepo.deleteFollowingSessions(currentSession.seriesId, currentSession.startTime);
            const remainingCount = deletedFutureSessions.length;

            if (remainingCount > 0) {
                // 2. Re-create them shifting exactly to the new Date anchor provided
                const sessionsToInsert = [];
                for (let i = 0; i < remainingCount; i++) {
                    let sessionStartTime = data.startTime;
                    // Note: If original rule was frequency=weekly, we just step forward. In an MVP context, all series are hardcoded WEEKLY. 
                    const isWeekly = currentSession.recurrenceRule?.includes("WEEKLY");
                    if (isWeekly) {
                        sessionStartTime = addWeeks(new Date(data.startTime), i).getTime();
                    }

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

                // 3. Batch re-insert
                const createdSessions = await this.sessionRepo.createSessions(sessionsToInsert);

                // 4. Batch mapping of participants
                const participantsToInsert = [];
                for (const session of createdSessions) {
                    for (const memberId of data.memberIds) {
                        participantsToInsert.push({
                            sessionId: session.id,
                            memberId,
                        });
                    }
                }

                if (participantsToInsert.length > 0) {
                    await this.sessionRepo.addParticipants(participantsToInsert);
                }
            }

            if (data.status) {
                await this.sessionRepo.updateSessionStatus(organizationId, sessionId, data.status);
            }
        }
        
        return { success: true };
    }

    async updateParticipantAttendance(
        organizationId: string, 
        sessionId: string, 
        participants: { memberId: string, absent: boolean, absenceReason?: string | null, notes?: string | null }[]
    ) {
        // Enforce boundary check before applying the patch structurally
        const currentSession = await this.sessionRepo.getSessionById(organizationId, sessionId);
        if (!currentSession) {
            throw new HTTPException(404, { message: "Session not found" });
        }

        if (participants.length > 0) {
            await this.sessionRepo.updateParticipantAttendance(sessionId, participants);
        }

        return { success: true };
    }

    async deleteSession(organizationId: string, sessionId: string, deleteForward: boolean) {
        const currentSession = await this.sessionRepo.getSessionById(organizationId, sessionId);
        if (!currentSession) {
            throw new HTTPException(404, { message: "Session not found" });
        }

        if (!deleteForward || !currentSession.seriesId) {
            await this.sessionRepo.deleteSessionSingle(organizationId, sessionId);
        } else {
            await this.sessionRepo.deleteFollowingSessions(currentSession.seriesId, currentSession.startTime);
        }
        
        return { success: true };
    }
}
