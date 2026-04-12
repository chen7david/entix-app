import type { AppDb } from "@api/factories/db.factory";
import {
    type NewSessionAttendance,
    type SessionAttendance,
    type SessionPaymentStatus,
    sessionAttendances,
} from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

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
     * Lists attendance records for an organization.
     *
     * TODO: Replace with cursor pagination before exposing via API endpoint.
     *       Currently capped at 500 rows as a safety guard against full-table scans.
     */
    async listByOrg(organizationId: string, limit = 500): Promise<SessionAttendance[]> {
        return this.db
            .select()
            .from(sessionAttendances)
            .where(eq(sessionAttendances.organizationId, organizationId))
            .limit(limit);
    }

    /**
     * Upserts an attendance record.
     * On conflict (sessionId + userId PK), only mutable fields are updated.
     * joinedAt and organizationId are immutable after the initial insert.
     */
    async upsert(input: NewSessionAttendance): Promise<SessionAttendance> {
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
    prepareUpdatePaymentStatus(sessionId: string, userId: string, status: SessionPaymentStatus) {
        return this.db
            .update(sessionAttendances)
            .set({ paymentStatus: status })
            .where(
                and(
                    eq(sessionAttendances.sessionId, sessionId),
                    eq(sessionAttendances.userId, userId)
                )
            );
    }

    /**
     * Deletes an attendance record. Returns true if a row was deleted.
     */
    async delete(sessionId: string, userId: string): Promise<boolean> {
        const result = await this.db
            .delete(sessionAttendances)
            .where(
                and(
                    eq(sessionAttendances.sessionId, sessionId),
                    eq(sessionAttendances.userId, userId)
                )
            )
            .returning({ sessionId: sessionAttendances.sessionId });
        return result.length > 0;
    }
}
