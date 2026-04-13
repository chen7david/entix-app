import { getDbClient } from "@api/factories/db.factory";
import type { AppContext } from "@api/helpers/types.helpers";
import type { EntixQueueMessage } from "@api/queues/entix.queue";
import { systemAuditEvents } from "@shared/db/schema";
import { and, eq, isNull, lt } from "drizzle-orm";

export async function enqueueMissedPayments(env: CloudflareBindings): Promise<void> {
    const ctx = { env } as AppContext;
    const db = getDbClient(ctx);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const missedPayments = await db
        .select({
            id: systemAuditEvents.id,
            organizationId: systemAuditEvents.organizationId,
        })
        .from(systemAuditEvents)
        .where(
            and(
                eq(systemAuditEvents.eventType, "payment.missed"),
                isNull(systemAuditEvents.acknowledgedAt),
                lt(systemAuditEvents.createdAt, fiveMinutesAgo)
            )
        );

    for (const payment of missedPayments) {
        const msg: EntixQueueMessage = {
            type: "billing.retry-missed-payment",
            eventId: payment.id,
            organizationId: payment.organizationId,
        };
        await env.QUEUE.send(msg);
    }

    console.log(`[Scheduled:MissedPayments] Enqueued ${missedPayments.length} missed payments`);
}
