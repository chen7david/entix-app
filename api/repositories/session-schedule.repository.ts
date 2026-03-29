import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import {
    type NewScheduledSession,
    type NewSessionAttendance,
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { and, eq, like, type SQL, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

export class SessionScheduleRepository {
    constructor(private db: AppDb) {}

    async createSessions(sessions: NewScheduledSession[]) {
        return this.db.insert(scheduledSessions).values(sessions).returning();
    }

    async addAttendances(attendances: NewSessionAttendance[]) {
        if (attendances.length === 0) return [];
        return this.db.insert(sessionAttendances).values(attendances).returning();
    }

    async deleteFollowingSessions(seriesId: string, fromTime: Date) {
        return this.db
            .delete(scheduledSessions)
            .where(
                and(
                    eq(scheduledSessions.seriesId, seriesId),
                    sql`${scheduledSessions.startTime} >= ${fromTime.getTime()}`
                )
            )
            .returning();
    }

    async deleteSessionSingle(organizationId: string, sessionId: string) {
        return this.db
            .delete(scheduledSessions)
            .where(
                and(
                    eq(scheduledSessions.organizationId, organizationId),
                    eq(scheduledSessions.id, sessionId)
                )
            )
            .returning();
    }

    async deleteAllSessionAttendances(sessionId: string) {
        return this.db
            .delete(sessionAttendances)
            .where(eq(sessionAttendances.sessionId, sessionId));
    }

    async getSessionsForOrg(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        limit: number = 25,
        cursor?: string,
        direction: "next" | "prev" = "next",
        search?: string
    ) {
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            scheduledSessions.startTime,
            scheduledSessions.id,
            cursor,
            direction
        );

        const conditions: SQL[] = [eq(scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSessions.startTime} <= ${endDate}`);
        if (cursorWhere) conditions.push(cursorWhere);

        if (search) {
            conditions.push(like(scheduledSessions.title, `%${search}%`));
        }

        const sessions = await this.db.query.scheduledSessions.findMany({
            where: and(...conditions),
            orderBy: orderBy,
            limit: limit + 1,
            with: {
                attendances: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                name: true,
                                image: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        const result = processPaginatedResult(sessions, limit, direction, (row) => ({
            primary: row.startTime.getTime(),
            secondary: row.id,
        }));

        return result;
    }

    async getSessionById(organizationId: string, sessionId: string) {
        return this.db.query.scheduledSessions.findFirst({
            where: and(
                eq(scheduledSessions.organizationId, organizationId),
                eq(scheduledSessions.id, sessionId)
            ),
            with: {
                attendances: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                name: true,
                                image: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async getScheduleMetricsForOrg(organizationId: string, startDate?: number, endDate?: number) {
        const conditions: SQL[] = [eq(scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSessions.startTime} <= ${endDate}`);

        const result = await this.db
            .select({
                total: sql<number>`cast(count(*) as int)`,
                completed: sql<number>`cast(sum(case when ${scheduledSessions.status} = 'completed' then 1 else 0 end) as int)`,
                cancelled: sql<number>`cast(sum(case when ${scheduledSessions.status} = 'cancelled' then 1 else 0 end) as int)`,
            })
            .from(scheduledSessions)
            .where(and(...conditions));

        return {
            total: result[0]?.total || 0,
            completed: result[0]?.completed || 0,
            cancelled: result[0]?.cancelled || 0,
        };
    }

    async getSessionTrendsForOrg(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        tzOffset: string = "+00:00"
    ) {
        const conditions: SQL[] = [eq(scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSessions.startTime} <= ${endDate}`);

        return this.db
            .select({
                date: sql<string>`strftime('%Y-%m-%d', datetime(${scheduledSessions.startTime} / 1000, 'unixepoch', ${tzOffset}))`,
                total: sql<number>`cast(count(*) as int)`,
                scheduled: sql<number>`cast(sum(case when ${scheduledSessions.status} = 'scheduled' then 1 else 0 end) as int)`,
                completed: sql<number>`cast(sum(case when ${scheduledSessions.status} = 'completed' then 1 else 0 end) as int)`,
                cancelled: sql<number>`cast(sum(case when ${scheduledSessions.status} = 'cancelled' then 1 else 0 end) as int)`,
            })
            .from(scheduledSessions)
            .where(and(...conditions))
            .groupBy(sql`1`)
            .orderBy(sql`1`);
    }

    async getAttendanceTrendsForOrg(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        tzOffset: string = "+00:00"
    ) {
        const conditions: SQL[] = [eq(scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${scheduledSessions.startTime} <= ${endDate}`);

        return this.db
            .select({
                date: sql<string>`strftime('%Y-%m-%d', datetime(${scheduledSessions.startTime} / 1000, 'unixepoch', ${tzOffset}))`,
                totalExpected: sql<number>`cast(count(${sessionAttendances.userId}) as int)`,
                present: sql<number>`cast(sum(case when ${sessionAttendances.absent} = 0 then 1 else 0 end) as int)`,
                absent: sql<number>`cast(sum(case when ${sessionAttendances.absent} = 1 then 1 else 0 end) as int)`,
            })
            .from(scheduledSessions)
            .leftJoin(sessionAttendances, eq(scheduledSessions.id, sessionAttendances.sessionId))
            .where(and(...conditions))
            .groupBy(sql`1`)
            .orderBy(sql`1`);
    }

    async updateSessionStatus(
        organizationId: string,
        sessionId: string,
        status: "scheduled" | "completed" | "cancelled"
    ) {
        const [updated] = await this.db
            .update(scheduledSessions)
            .set({ status })
            .where(
                and(
                    eq(scheduledSessions.organizationId, organizationId),
                    eq(scheduledSessions.id, sessionId)
                )
            )
            .returning();
        return updated;
    }

    async updateAttendance(
        sessionId: string,
        attendances: {
            userId: string;
            absent: boolean;
            absenceReason?: string | null;
            notes?: string | null;
        }[]
    ) {
        const updates = attendances.map((p) =>
            this.db
                .update(sessionAttendances)
                .set({
                    absent: p.absent,
                    absenceReason: p.absenceReason || null,
                    notes: p.notes || null,
                })
                .where(
                    and(
                        eq(sessionAttendances.sessionId, sessionId),
                        eq(sessionAttendances.userId, p.userId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        return this.db.batch(updates as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
    }

    async updateSessionDetails(
        organizationId: string,
        sessionId: string,
        data: {
            title: string;
            description?: string | null;
            startTime: Date;
            durationMinutes: number;
        }
    ) {
        const [updated] = await this.db
            .update(scheduledSessions)
            .set(data)
            .where(
                and(
                    eq(scheduledSessions.organizationId, organizationId),
                    eq(scheduledSessions.id, sessionId)
                )
            )
            .returning();
        return updated;
    }
}
