import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import {
    type AuditSeverity,
    type NewSystemAuditEvent,
    type SystemAuditEvent,
    systemAuditEvents,
} from "@shared/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

/**
 * Convenience helper to prepare an audit event for db.batch().
 * Explicitly typed to prevent API surface surprises.
 */
export function prepareAuditEvent(
    repo: SystemAuditRepository,
    input: NewSystemAuditEvent
): BatchItem<"sqlite"> {
    return repo.prepareInsert(input);
}

/**
 * Repository for system audit database operations.
 * Append-only by design.
 */
export class SystemAuditRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Inserts a new system audit event and returns the created record.
     */
    async insert(input: NewSystemAuditEvent): Promise<SystemAuditEvent> {
        const [event] = await this.db.insert(systemAuditEvents).values(input).returning();
        return event;
    }

    /**
     * Returns a prepared insert statement for use in db.batch().
     * Append-only — no update or delete methods exist by design.
     */
    prepareInsert(input: NewSystemAuditEvent) {
        return this.db.insert(systemAuditEvents).values(input);
    }

    /**
     * Lists audit events with cursor pagination.
     * Default sort: createdAt DESC, id DESC.
     */
    async list(filters: {
        organizationId: string;
        severity?: AuditSeverity;
        eventType?: string;
        actorId?: string;
        unresolvedOnly?: boolean;
        limit?: number;
        cursor?: string;
        direction?: "next" | "prev";
    }) {
        const {
            organizationId,
            severity,
            eventType,
            actorId,
            unresolvedOnly,
            limit = 20,
            cursor,
            direction = "next",
        } = filters;

        const { where: cursorWhere, orderBy } = buildCursorPagination(
            systemAuditEvents.createdAt,
            systemAuditEvents.id,
            cursor,
            direction
        );

        const conditions = [eq(systemAuditEvents.organizationId, organizationId)];
        if (severity) {
            conditions.push(eq(systemAuditEvents.severity, severity));
        }
        if (eventType) {
            conditions.push(eq(systemAuditEvents.eventType, eventType));
        }
        if (actorId) {
            conditions.push(eq(systemAuditEvents.actorId, actorId));
        }
        if (unresolvedOnly) {
            conditions.push(isNull(systemAuditEvents.acknowledgedAt));
        }
        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const items = await this.db
            .select()
            .from(systemAuditEvents)
            .where(and(...conditions))
            .orderBy(...orderBy)
            .limit(limit + 1);

        return processPaginatedResult(
            items,
            limit,
            direction,
            (item) => ({
                primary: item.createdAt.getTime(),
                secondary: item.id,
            }),
            cursor
        );
    }

    /**
     * Acknowledges an audit event
     */
    async acknowledge(id: string, userId: string, now: Date = new Date()) {
        await this.db
            .update(systemAuditEvents)
            .set({
                acknowledgedAt: now,
                acknowledgedBy: userId,
            })
            .where(eq(systemAuditEvents.id, id));
    }
}
