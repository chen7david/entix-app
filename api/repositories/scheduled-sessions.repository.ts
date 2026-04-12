import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import {
    type NewScheduledSession,
    type ScheduledSession,
    scheduledSessions,
} from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Repository for scheduled session database operations.
 */
export class ScheduledSessionsRepository {
    constructor(private readonly db: AppDb) {}

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
}
