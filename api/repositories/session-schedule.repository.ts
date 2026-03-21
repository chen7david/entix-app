import { eq, and, sql, like } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { scheduledSession, scheduledSessionParticipant } from "@shared/db/schema.db";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";

export class SessionScheduleRepository {
    constructor(private db: DrizzleD1Database<any>) {}

    async createSessions(sessions: (typeof scheduledSession.$inferInsert)[]) {
        return this.db.insert(scheduledSession).values(sessions).returning();
    }

    async addParticipants(participants: (typeof scheduledSessionParticipant.$inferInsert)[]) {
        if (participants.length === 0) return [];
        return this.db.insert(scheduledSessionParticipant).values(participants).returning();
    }

    async deleteFollowingSessions(seriesId: string, fromTime: Date) {
        return this.db.delete(scheduledSession)
            .where(and(eq(scheduledSession.seriesId, seriesId), sql`${scheduledSession.startTime} >= ${fromTime.getTime()}`))
            .returning();
    }
    
    async deleteSessionSingle(organizationId: string, sessionId: string) {
        return this.db.delete(scheduledSession)
            .where(and(eq(scheduledSession.organizationId, organizationId), eq(scheduledSession.id, sessionId)))
            .returning();
    }
    
    async deleteAllSessionParticipants(sessionId: string) {
        return this.db.delete(scheduledSessionParticipant)
            .where(eq(scheduledSessionParticipant.sessionId, sessionId));
    }

    async getSessionsForOrg(
        organizationId: string, 
        startDate?: number, 
        endDate?: number,
        limit: number = 25,
        cursor?: string,
        direction: 'next' | 'prev' = 'next',
        search?: string
    ) {
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            scheduledSession.startTime,
            scheduledSession.id,
            cursor,
            direction
        );

        let conditions: any[] = [eq(scheduledSession.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSession.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSession.startTime} <= ${endDate}`);
        if (cursorWhere) conditions.push(cursorWhere);
        
        if (search) {
            conditions.push(like(scheduledSession.title, `%${search}%`));
        }

        // @ts-expect-error Types map out correctly natively
        const sessions = await this.db.query.scheduledSession.findMany({
            where: and(...conditions),
            orderBy: (orderBy as any),
            limit: limit + 1,
            with: {
                participants: {
                    with: {
                        member: {
                            with: {
                                user: {
                                    columns: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const result = processPaginatedResult(
            sessions,
            limit,
            direction,
            (row: any) => ({ primary: row.startTime.getTime(), secondary: row.id })
        );

        return result;
    }

    async getSessionById(organizationId: string, sessionId: string) {
        // @ts-expect-error Drizzle inference resolution
        return this.db.query.scheduledSession.findFirst({
            where: and(eq(scheduledSession.organizationId, organizationId), eq(scheduledSession.id, sessionId)),
            with: {
                participants: {
                    with: {
                        member: {
                            with: {
                                user: {
                                    columns: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async updateSessionStatus(organizationId: string, sessionId: string, status: "scheduled" | "completed" | "cancelled") {
        const [updated] = await this.db.update(scheduledSession)
            .set({ status })
            .where(and(eq(scheduledSession.organizationId, organizationId), eq(scheduledSession.id, sessionId)))
            .returning();
        return updated;
    }

    async updateParticipantAttendance(sessionId: string, participants: { memberId: string, absent: boolean, absenceReason?: string | null, notes?: string | null }[]) {
        const updates = participants.map((p) => 
            this.db.update(scheduledSessionParticipant)
                .set({
                    absent: p.absent,
                    absenceReason: p.absenceReason || null,
                    notes: p.notes || null
                })
                .where(and(
                    eq(scheduledSessionParticipant.sessionId, sessionId),
                    eq(scheduledSessionParticipant.memberId, p.memberId)
                ))
        );
        return this.db.batch(updates as any);
    }

    async updateSessionDetails(organizationId: string, sessionId: string, data: { title: string, description?: string | null, startTime: Date, durationMinutes: number }) {
        const [updated] = await this.db.update(scheduledSession)
            .set(data)
            .where(and(eq(scheduledSession.organizationId, organizationId), eq(scheduledSession.id, sessionId)))
            .returning();
        return updated;
    }
}
