import { BadRequestError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import {
    type NewSessionAttendance,
    type SessionAttendance,
    type SessionPaymentStatus,
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { and, eq, ne, type SQL } from "drizzle-orm";

/**
 * Repository for session attendance database operations.
 */
export class SessionAttendancesRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Finds an attendance record by sessionId and userId.
     */
    async findByIds(sessionId: string, userId: string): Promise<SessionAttendance | null> {
        const [attendance] = await this.db
            .select()
            .from(sessionAttendances)
            .where(
                and(
                    eq(sessionAttendances.sessionId, sessionId),
                    eq(sessionAttendances.userId, userId)
                )
            )
            .limit(1);
        return attendance ?? null;
    }

    async findById(id: string, organizationId: string): Promise<SessionAttendance | null> {
        const [attendance] = await this.db
            .select()
            .from(sessionAttendances)
            .where(
                and(
                    eq(sessionAttendances.id, id),
                    eq(sessionAttendances.organizationId, organizationId)
                )
            )
            .limit(1);
        return attendance ?? null;
    }

    /**
     * Lists all attendance records for a specific session.
     */
    async listBySession(sessionId: string): Promise<SessionAttendance[]> {
        return this.db
            .select()
            .from(sessionAttendances)
            .where(eq(sessionAttendances.sessionId, sessionId));
    }

    /**
     * Lists attendance records with cursor pagination.
     * Default sort: joinedAt DESC, userId DESC.
     */
    async list(filters: {
        organizationId: string;
        sessionId?: string;
        paymentStatus?: SessionPaymentStatus;
        limit?: number;
        cursor?: string;
        direction?: "next" | "prev";
    }) {
        const {
            organizationId,
            sessionId,
            paymentStatus,
            limit = 20,
            cursor,
            direction = "next",
        } = filters;

        const { where: cursorWhere, orderBy } = buildCursorPagination(
            sessionAttendances.joinedAt,
            sessionAttendances.userId,
            cursor,
            direction
        );

        const conditions = [eq(sessionAttendances.organizationId, organizationId)];
        if (sessionId) {
            conditions.push(eq(sessionAttendances.sessionId, sessionId));
        }
        if (paymentStatus) {
            conditions.push(eq(sessionAttendances.paymentStatus, paymentStatus));
        }
        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const items = await this.db
            .select()
            .from(sessionAttendances)
            .where(and(...conditions))
            .orderBy(...orderBy)
            .limit(limit + 1);

        return processPaginatedResult(
            items,
            limit,
            direction,
            (item) => ({
                primary: item.joinedAt.getTime(),
                secondary: item.userId,
            }),
            cursor
        );
    }

    /**
     * Upserts an attendance record.
     * On conflict (sessionId + userId PK), only mutable fields are updated.
     * joinedAt and organizationId are immutable after the initial insert.
     */
    async upsert(input: NewSessionAttendance): Promise<SessionAttendance> {
        await this.assertSessionMutable(input.organizationId, input.sessionId);

        const [attendance] = await this.db
            .insert(sessionAttendances)
            .values(input)
            .onConflictDoUpdate({
                target: [sessionAttendances.sessionId, sessionAttendances.userId],
                set: {
                    absent: input.absent,
                    absenceReason: input.absenceReason,
                    notes: input.notes,
                    paymentStatus: input.paymentStatus,
                },
            })
            .returning();
        return attendance;
    }

    /**
     * Executes a payment status update and returns the updated record.
     */
    async updatePaymentStatus(
        sessionId: string,
        userId: string,
        status: SessionPaymentStatus
    ): Promise<SessionAttendance | null> {
        const [attendanceRecord] = await this.db
            .select({ organizationId: sessionAttendances.organizationId })
            .from(sessionAttendances)
            .where(
                and(
                    eq(sessionAttendances.sessionId, sessionId),
                    eq(sessionAttendances.userId, userId)
                )
            )
            .limit(1);

        if (attendanceRecord) {
            await this.assertSessionMutable(attendanceRecord.organizationId, sessionId);
        }

        const [attendance] = await this.db
            .update(sessionAttendances)
            .set({ paymentStatus: status })
            .where(
                and(
                    eq(sessionAttendances.sessionId, sessionId),
                    eq(sessionAttendances.userId, userId)
                )
            )
            .returning();
        return attendance ?? null;
    }

    /**
     * Returns a prepared statement for updating payment status (for use in db.batch()).
     */
    prepareUpdatePaymentStatus(
        sessionId: string,
        userId: string,
        status: SessionPaymentStatus,
        guard?: SQL
    ) {
        const conditions = [
            eq(sessionAttendances.sessionId, sessionId),
            eq(sessionAttendances.userId, userId),
        ];

        if (guard) {
            conditions.push(guard);
        }

        return this.db
            .update(sessionAttendances)
            .set({ paymentStatus: status })
            .where(and(...conditions));
    }

    /**
     * Deletes an attendance record. Returns true if a row was deleted.
     */
    async delete(id: string, organizationId: string): Promise<boolean> {
        const [attendance] = await this.db
            .select({
                sessionId: sessionAttendances.sessionId,
            })
            .from(sessionAttendances)
            .where(
                and(
                    eq(sessionAttendances.id, id),
                    eq(sessionAttendances.organizationId, organizationId)
                )
            )
            .limit(1);

        if (!attendance) {
            return false;
        }

        await this.assertSessionMutable(organizationId, attendance.sessionId);

        const result = await this.db
            .delete(sessionAttendances)
            .where(
                and(
                    eq(sessionAttendances.id, id),
                    eq(sessionAttendances.organizationId, organizationId)
                )
            )
            .returning({ id: sessionAttendances.id });
        return result.length > 0;
    }

    private async assertSessionMutable(organizationId: string, sessionId: string): Promise<void> {
        const [session] = await this.db
            .select({ id: scheduledSessions.id })
            .from(scheduledSessions)
            .where(
                and(
                    eq(scheduledSessions.organizationId, organizationId),
                    eq(scheduledSessions.id, sessionId),
                    ne(scheduledSessions.status, "completed")
                )
            )
            .limit(1);

        if (!session) {
            throw new BadRequestError("Cannot modify enrollment for completed or missing session.");
        }
    }
}
