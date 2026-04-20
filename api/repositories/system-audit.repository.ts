import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import {
    type AuditSeverity,
    type NewSystemAuditEvent,
    type SystemAuditEvent,
    systemAuditEvents,
} from "@shared/db/schema";
import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
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
     * Returns a prepared insert statement that only executes if the guard condition is met.
     *
     * `guard` MUST be a complete boolean SQL expression — typically an EXISTS subquery.
     * SQLite allows `SELECT <values> WHERE <condition>` without a FROM clause:
     *   - condition truthy  → 1 row returned → INSERT fires.
     *   - condition falsy   → 0 rows returned → INSERT is a no-op (no ghost row).
     *
     * Column order MUST match systemAuditEvents schema definition order:
     *   id, organizationId, eventType, severity, actorId, actorType,
     *   subjectType, subjectId, message, metadata, acknowledgedAt, acknowledgedBy, createdAt
     */
    prepareGuardedInsert(input: NewSystemAuditEvent, guard: SQL) {
        const createdAt = input.createdAt instanceof Date ? input.createdAt.getTime() : Date.now();

        return this.db.insert(systemAuditEvents).select(
            this.db
                .select({
                    id: sql`${input.id}`.as("id"),
                    organizationId: sql`${input.organizationId}`.as("organizationId"),
                    eventType: sql`${input.eventType}`.as("eventType"),
                    severity: sql`${input.severity ?? "info"}`.as("severity"),
                    actorId: sql`${input.actorId ?? null}`.as("actorId"),
                    actorType: sql`${input.actorType ?? "system"}`.as("actorType"),
                    subjectType: sql`${input.subjectType ?? null}`.as("subjectType"),
                    subjectId: sql`${input.subjectId ?? null}`.as("subjectId"),
                    message: sql`${input.message}`.as("message"),
                    metadata: sql`${input.metadata ?? null}`.as("metadata"),
                    acknowledgedAt: sql`null`.as("acknowledgedAt"),
                    acknowledgedBy: sql`null`.as("acknowledgedBy"),
                    createdAt: sql`${createdAt}`.as("createdAt"),
                })
                .from(sql`(SELECT 1) AS one_row_source`)
                .where(guard)
        );
    }

    /**
     * Lists audit events with cursor pagination.
     * Default sort: createdAt DESC, id DESC.
     */
    async list(filters: {
        organizationId?: string;
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

        const conditions = [];
        if (organizationId) {
            conditions.push(eq(systemAuditEvents.organizationId, organizationId));
        }
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
     * Loads a single audit row scoped by organization.
     */
    async findByIdAndOrganization(
        id: string,
        organizationId: string
    ): Promise<SystemAuditEvent | null> {
        const row = await this.db.query.systemAuditEvents.findFirst({
            where: and(
                eq(systemAuditEvents.id, id),
                eq(systemAuditEvents.organizationId, organizationId)
            ),
        });
        return row ?? null;
    }

    /**
     * Sets acknowledgment fields. When `organizationId` is set, the update matches both id and org.
     */
    async setAcknowledged(
        id: string,
        options: { at: Date; acknowledgedBy: string | null; organizationId?: string }
    ) {
        const conditions = [eq(systemAuditEvents.id, id)];
        if (options.organizationId !== undefined) {
            conditions.push(eq(systemAuditEvents.organizationId, options.organizationId));
        }
        await this.db
            .update(systemAuditEvents)
            .set({
                acknowledgedAt: options.at,
                acknowledgedBy: options.acknowledgedBy,
            })
            .where(and(...conditions));
    }

    /**
     * Acknowledges an audit event (by id only).
     */
    async acknowledge(id: string, userId: string, now: Date = new Date()) {
        await this.setAcknowledged(id, { at: now, acknowledgedBy: userId });
    }
}
