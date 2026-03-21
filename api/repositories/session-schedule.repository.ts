import { eq, and, sql, like } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { scheduledSession, sessionAttendance } from "@shared/db/schema.db";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";

export class SessionScheduleRepository {
    constructor(private db: DrizzleD1Database<any>) {}

    async createSessions(sessions: (typeof scheduledSession.$inferInsert)[]) {
        return this.db.insert(scheduledSession).values(sessions).returning();
    }

    async addAttendances(attendances: (typeof sessionAttendance.$inferInsert)[]) {
        if (attendances.length === 0) return [];
        return this.db.insert(sessionAttendance).values(attendances).returning();
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
    
    async deleteAllSessionAttendances(sessionId: string) {
        return this.db.delete(sessionAttendance)
            .where(eq(sessionAttendance.sessionId, sessionId));
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
                attendances: {
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
                attendances: {
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
        });
    }

    async getScheduleMetricsForOrg(organizationId: string, startDate?: number, endDate?: number) {
        let conditions: any[] = [eq(scheduledSession.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSession.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSession.startTime} <= ${endDate}`);

        const result = await this.db.select({
            total: sql<number>`cast(count(*) as int)`,
            completed: sql<number>`cast(sum(case when ${scheduledSession.status} = 'completed' then 1 else 0 end) as int)`,
            cancelled: sql<number>`cast(sum(case when ${scheduledSession.status} = 'cancelled' then 1 else 0 end) as int)`
        }).from(scheduledSession).where(and(...conditions));

        return {
            total: result[0]?.total || 0,
            completed: result[0]?.completed || 0,
            cancelled: result[0]?.cancelled || 0
        };
    }

    async getSessionTrendsForOrg(organizationId: string, startDate?: number, endDate?: number, tzOffset: string = "+00:00") {
        let conditions: any[] = [eq(scheduledSession.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSession.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSession.startTime} <= ${endDate}`);

        return this.db.select({
            date: sql<string>`strftime('%Y-%m-%d', datetime(${scheduledSession.startTime} / 1000, 'unixepoch', ${tzOffset}))`,
            total: sql<number>`cast(count(*) as int)`,
            scheduled: sql<number>`cast(sum(case when ${scheduledSession.status} = 'scheduled' then 1 else 0 end) as int)`,
            completed: sql<number>`cast(sum(case when ${scheduledSession.status} = 'completed' then 1 else 0 end) as int)`,
            cancelled: sql<number>`cast(sum(case when ${scheduledSession.status} = 'cancelled' then 1 else 0 end) as int)`
        })
        .from(scheduledSession)
        .where(and(...conditions))
        .groupBy(sql`1`)
        .orderBy(sql`1`);
    }

    async getAttendanceTrendsForOrg(organizationId: string, startDate?: number, endDate?: number, tzOffset: string = "+00:00") {
        let conditions: any[] = [eq(scheduledSession.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSession.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSession.startTime} <= ${endDate}`);

        return this.db.select({
            date: sql<string>`strftime('%Y-%m-%d', datetime(${scheduledSession.startTime} / 1000, 'unixepoch', ${tzOffset}))`,
            totalExpected: sql<number>`cast(count(${sessionAttendance.userId}) as int)`,
            present: sql<number>`cast(sum(case when ${sessionAttendance.absent} = 0 then 1 else 0 end) as int)`,
            absent: sql<number>`cast(sum(case when ${sessionAttendance.absent} = 1 then 1 else 0 end) as int)`
        })
        .from(scheduledSession)
        .leftJoin(sessionAttendance, eq(scheduledSession.id, sessionAttendance.sessionId))
        .where(and(...conditions))
        .groupBy(sql`1`)
        .orderBy(sql`1`);
    }

    async updateSessionStatus(organizationId: string, sessionId: string, status: "scheduled" | "completed" | "cancelled") {
        const [updated] = await this.db.update(scheduledSession)
            .set({ status })
            .where(and(eq(scheduledSession.organizationId, organizationId), eq(scheduledSession.id, sessionId)))
            .returning();
        return updated;
    }

    async updateAttendance(sessionId: string, attendances: { userId: string, absent: boolean, absenceReason?: string | null, notes?: string | null }[]) {
        const updates = attendances.map((p) => 
            this.db.update(sessionAttendance)
                .set({
                    absent: p.absent,
                    absenceReason: p.absenceReason || null,
                    notes: p.notes || null
                })
                .where(and(
                    eq(sessionAttendance.sessionId, sessionId),
                    eq(sessionAttendance.userId, p.userId)
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
