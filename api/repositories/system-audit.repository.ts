import type { AppDb } from "@api/factories/db.factory";
import {
    type NewSystemAuditEvent,
    type SystemAuditEvent,
    systemAuditEvents,
} from "@shared/db/schema";
import { desc, eq } from "drizzle-orm";

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
     * Lists audit events for an organization.
     *
     * TODO: Replace with cursor pagination before exposing via API endpoint.
     *       Currently capped at 500 rows as a safety guard against full-table scans.
     */
    async listByOrg(organizationId: string, limit = 500): Promise<SystemAuditEvent[]> {
        return this.db
            .select()
            .from(systemAuditEvents)
            .where(eq(systemAuditEvents.organizationId, organizationId))
            .orderBy(desc(systemAuditEvents.createdAt))
            .limit(limit);
    }
}
