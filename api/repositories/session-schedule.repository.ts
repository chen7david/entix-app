import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import type { NewScheduledSession, NewSessionAttendance } from "@shared/db/schema";
import * as schema from "@shared/db/schema";
import { and, eq, like, type SQL, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

export class SessionScheduleRepository {
    constructor(private db: AppDb) {}

    async createSessions(sessions: NewScheduledSession[]): Promise<schema.ScheduledSession[]> {
        return this.db.insert(schema.scheduledSessions).values(sessions).returning();
    }

    async addAttendances(attendances: NewSessionAttendance[]) {
        if (attendances.length === 0) return [];
        return this.db.insert(schema.sessionAttendances).values(attendances).returning();
    }

    async deleteFollowingSessions(seriesId: string, fromTime: Date) {
        return this.db
            .delete(schema.scheduledSessions)
            .where(
                and(
                    eq(schema.scheduledSessions.seriesId, seriesId),
                    sql`${schema.scheduledSessions.startTime} >= ${fromTime.getTime()}`
                )
            )
            .returning();
    }

    async deleteSessionSingle(organizationId: string, sessionId: string) {
        return this.db
            .delete(schema.scheduledSessions)
            .where(
                and(
                    eq(schema.scheduledSessions.organizationId, organizationId),
                    eq(schema.scheduledSessions.id, sessionId)
                )
            )
            .returning();
    }

    async deleteAllSessionAttendances(sessionId: string) {
        return this.db
            .delete(schema.sessionAttendances)
            .where(eq(schema.sessionAttendances.sessionId, sessionId));
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
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.scheduledSessions.startTime,
            schema.scheduledSessions.id,
            cursor,
            direction
        );

        const conditions: SQL[] = [eq(schema.scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${schema.scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${schema.scheduledSessions.startTime} <= ${endDate}`);
        if (cursorWhere) conditions.push(cursorWhere);

        if (search) {
            conditions.push(like(schema.scheduledSessions.title, `%${search}%`));
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

        const result = processPaginatedResult(
            sessions,
            limit,
            direction,
            (row) => ({
                primary: row.startTime.getTime(),
                secondary: row.id,
            }),
            cursor
        );

        return result;
    }

    async findSessionById(organizationId: string, sessionId: string) {
        const session = await this.db.query.scheduledSessions.findFirst({
            where: and(
                eq(schema.scheduledSessions.organizationId, organizationId),
                eq(schema.scheduledSessions.id, sessionId)
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
        return session ?? null;
    }

    async findScheduleMetricsByOrganization(
        organizationId: string,
        startDate?: number,
        endDate?: number
    ) {
        const conditions: SQL[] = [eq(schema.scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${schema.scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${schema.scheduledSessions.startTime} <= ${endDate}`);

        const result = await this.db
            .select({
                total: sql<number>`cast(count(*) as int)`,
                completed: sql<number>`cast(sum(case when ${schema.scheduledSessions.status} = 'completed' then 1 else 0 end) as int)`,
                cancelled: sql<number>`cast(sum(case when ${schema.scheduledSessions.status} = 'cancelled' then 1 else 0 end) as int)`,
            })
            .from(schema.scheduledSessions)
            .where(and(...conditions));

        return {
            total: result[0]?.total || 0,
            completed: result[0]?.completed || 0,
            cancelled: result[0]?.cancelled || 0,
        };
    }

    async findSessionTrendsByOrganization(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        tzOffset: string = "+00:00"
    ) {
        const conditions: SQL[] = [eq(schema.scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${schema.scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${schema.scheduledSessions.startTime} <= ${endDate}`);

        return this.db
            .select({
                date: sql<string>`strftime('%Y-%m-%d', datetime(${schema.scheduledSessions.startTime} / 1000, 'unixepoch', ${tzOffset}))`,
                total: sql<number>`cast(count(*) as int)`,
                scheduled: sql<number>`cast(sum(case when ${schema.scheduledSessions.status} = 'scheduled' then 1 else 0 end) as int)`,
                completed: sql<number>`cast(sum(case when ${schema.scheduledSessions.status} = 'completed' then 1 else 0 end) as int)`,
                cancelled: sql<number>`cast(sum(case when ${schema.scheduledSessions.status} = 'cancelled' then 1 else 0 end) as int)`,
            })
            .from(schema.scheduledSessions)
            .where(and(...conditions))
            .groupBy(sql`1`)
            .orderBy(sql`1`);
    }

    async findAttendanceTrendsByOrganization(
        organizationId: string,
        startDate?: number,
        endDate?: number,
        tzOffset: string = "+00:00"
    ) {
        const conditions: SQL[] = [eq(schema.scheduledSessions.organizationId, organizationId)];
        if (startDate) conditions.push(sql`${schema.scheduledSessions.startTime} >= ${startDate}`);
        if (endDate) conditions.push(sql`${schema.scheduledSessions.startTime} <= ${endDate}`);

        return this.db
            .select({
                date: sql<string>`strftime('%Y-%m-%d', datetime(${schema.scheduledSessions.startTime} / 1000, 'unixepoch', ${tzOffset}))`,
                totalExpected: sql<number>`cast(count(${schema.sessionAttendances.userId}) as int)`,
                present: sql<number>`cast(sum(case when ${schema.sessionAttendances.absent} = 0 then 1 else 0 end) as int)`,
                absent: sql<number>`cast(sum(case when ${schema.sessionAttendances.absent} = 1 then 1 else 0 end) as int)`,
            })
            .from(schema.scheduledSessions)
            .leftJoin(
                schema.sessionAttendances,
                eq(schema.scheduledSessions.id, schema.sessionAttendances.sessionId)
            )
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
            .update(schema.scheduledSessions)
            .set({ status })
            .where(
                and(
                    eq(schema.scheduledSessions.organizationId, organizationId),
                    eq(schema.scheduledSessions.id, sessionId)
                )
            )
            .returning();
        return updated ?? null;
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
                .update(schema.sessionAttendances)
                .set({
                    absent: p.absent,
                    absenceReason: p.absenceReason || null,
                    notes: p.notes || null,
                })
                .where(
                    and(
                        eq(schema.sessionAttendances.sessionId, sessionId),
                        eq(schema.sessionAttendances.userId, p.userId)
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
            .update(schema.scheduledSessions)
            .set(data)
            .where(
                and(
                    eq(schema.scheduledSessions.organizationId, organizationId),
                    eq(schema.scheduledSessions.id, sessionId)
                )
            )
            .returning();
        return updated ?? null;
    }

    async findAttendancesBySessionId(sessionId: string) {
        return this.db.query.sessionAttendances.findMany({
            where: eq(schema.sessionAttendances.sessionId, sessionId),
        });
    }
}
