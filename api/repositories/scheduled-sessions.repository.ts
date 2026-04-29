import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import {
    authUsers,
    lessons,
    type NewScheduledSession,
    type ScheduledSession,
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * Repository for scheduled session database operations.
 */
export class ScheduledSessionsRepository {
    constructor(private readonly db: AppDb) {}

    private toIsoString(value: Date | number | string): string {
        if (value instanceof Date) {
            return value.toISOString();
        }

        // SQLite expressions (for computed fields like endTime) return epoch ms integers.
        return new Date(value).toISOString();
    }

    /**
     * Finds a session by its unique ID.
     */
    async findById(id: string): Promise<ScheduledSession | null> {
        const [session] = await this.db
            .select()
            .from(scheduledSessions)
            .where(eq(scheduledSessions.id, id))
            .limit(1);
        return session ?? null;
    }

    async findByIdInOrganization(
        organizationId: string,
        id: string
    ): Promise<ScheduledSession | null> {
        const [session] = await this.db
            .select()
            .from(scheduledSessions)
            .where(
                and(
                    eq(scheduledSessions.organizationId, organizationId),
                    eq(scheduledSessions.id, id)
                )
            )
            .limit(1);
        return session ?? null;
    }

    /**
     * Lists sessions for an organization with cursor pagination.
     * Default sort: startTime DESC.
     */
    async list(filters: {
        organizationId: string;
        status?: ScheduledSession["status"];
        limit?: number;
        cursor?: string;
        direction?: "next" | "prev";
    }) {
        const { organizationId, status, limit = 20, cursor, direction = "next" } = filters;

        const { where: cursorWhere, orderBy } = buildCursorPagination(
            scheduledSessions.startTime,
            scheduledSessions.id,
            cursor,
            direction
        );

        const conditions = [eq(scheduledSessions.organizationId, organizationId)];
        if (status) {
            conditions.push(eq(scheduledSessions.status, status));
        }
        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const items = await this.db
            .select()
            .from(scheduledSessions)
            .where(and(...conditions))
            .orderBy(...orderBy)
            .limit(limit + 1);

        return processPaginatedResult(
            items,
            limit,
            direction,
            (item) => ({
                primary: item.startTime.getTime(),
                secondary: item.id,
            }),
            cursor
        );
    }

    /**
     * Inserts a new scheduled session.
     */
    async insert(input: NewScheduledSession): Promise<ScheduledSession> {
        const [session] = await this.db.insert(scheduledSessions).values(input).returning();
        return session;
    }

    /**
     * Updates an existing session.
     */
    async update(
        id: string,
        input: Partial<NewScheduledSession>
    ): Promise<ScheduledSession | null> {
        const [session] = await this.db
            .update(scheduledSessions)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(scheduledSessions.id, id))
            .returning();
        return session ?? null;
    }

    /**
     * Deletes a session. Returns true if a row was deleted.
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.db
            .delete(scheduledSessions)
            .where(eq(scheduledSessions.id, id))
            .returning({ id: scheduledSessions.id });
        return result.length > 0;
    }

    async getStudentDashboard(params: { organizationId: string; userId: string }): Promise<
        {
            sessionId: string;
            lessonTitle: string;
            startTime: string;
            endTime: string;
            teacherName: string;
            sessionStatus: "scheduled" | "completed" | "cancelled";
            enrollmentStatus: string;
        }[]
    > {
        const rows = await this.db
            .select({
                sessionId: scheduledSessions.id,
                lessonTitle: lessons.title,
                startTime: scheduledSessions.startTime,
                endTime: sql<number>`${scheduledSessions.startTime} + (${scheduledSessions.durationMinutes} * 60000)`,
                teacherName: authUsers.name,
                sessionStatus: scheduledSessions.status,
                enrollmentStatus: sessionAttendances.paymentStatus,
            })
            .from(sessionAttendances)
            .innerJoin(scheduledSessions, eq(sessionAttendances.sessionId, scheduledSessions.id))
            .innerJoin(lessons, eq(scheduledSessions.lessonId, lessons.id))
            .innerJoin(authUsers, eq(scheduledSessions.teacherId, authUsers.id))
            .where(
                and(
                    eq(sessionAttendances.organizationId, params.organizationId),
                    eq(sessionAttendances.userId, params.userId)
                )
            );

        return rows.map((row) => ({
            sessionId: row.sessionId,
            lessonTitle: row.lessonTitle,
            startTime: this.toIsoString(row.startTime),
            endTime: this.toIsoString(row.endTime),
            teacherName: row.teacherName ?? "",
            sessionStatus: row.sessionStatus,
            enrollmentStatus: row.enrollmentStatus,
        }));
    }
}
