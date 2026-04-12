import type { AppDb } from "@api/factories/db.factory";
import {
    type FinancialSessionPaymentEvent,
    financialSessionPaymentEvents,
    type NewFinancialSessionPaymentEvent,
} from "@shared/db/schema";
import { and, desc, eq } from "drizzle-orm";

/**
 * Repository for session payment event database operations.
 * Append-only by design.
 */
export class SessionPaymentEventsRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Inserts a new session payment event and returns the created record.
     */
    async insert(input: NewFinancialSessionPaymentEvent): Promise<FinancialSessionPaymentEvent> {
        const [event] = await this.db
            .insert(financialSessionPaymentEvents)
            .values(input)
            .returning();
        return event;
    }

    /**
     * Returns a prepared insert statement for use in db.batch().
     * Append-only — no update or delete methods exist by design.
     */
    prepareInsert(input: NewFinancialSessionPaymentEvent) {
        return this.db.insert(financialSessionPaymentEvents).values(input);
    }

    /**
     * Lists all payment events for a specific session.
     */
    async listBySession(sessionId: string): Promise<FinancialSessionPaymentEvent[]> {
        return this.db
            .select()
            .from(financialSessionPaymentEvents)
            .where(eq(financialSessionPaymentEvents.sessionId, sessionId))
            .orderBy(desc(financialSessionPaymentEvents.createdAt));
    }

    /**
     * Lists payment events for a specific user in a specific session.
     */
    async listByUserInSession(
        sessionId: string,
        userId: string
    ): Promise<FinancialSessionPaymentEvent[]> {
        return this.db
            .select()
            .from(financialSessionPaymentEvents)
            .where(
                and(
                    eq(financialSessionPaymentEvents.sessionId, sessionId),
                    eq(financialSessionPaymentEvents.userId, userId)
                )
            )
            .orderBy(desc(financialSessionPaymentEvents.createdAt));
    }
}
