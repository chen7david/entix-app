import { systemAuditEvents } from "@shared/db/schema";
import { and, eq, isNull, lt } from "drizzle-orm";
import app from "./app";
import { getDbClient } from "./factories/db.factory";

export default {
    fetch: app.fetch,

    /**
     * Periodic task to find unresolved missed payments and enqueue them for retry.
     */
    async scheduled(_controller: any, env: CloudflareBindings, _ctx: ExecutionContext) {
        const db = getDbClient({ env } as any);

        // Find unresolved missed payment events older than 5 minutes (to avoid racing with the initial charge)
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
            await env.BILLING_RECONCILIATION_QUEUE.send({
                eventId: payment.id,
                organizationId: payment.organizationId,
            });
        }

        console.log(
            `[Scheduled] Enqueued ${missedPayments.length} missed payments for reconciliation.`
        );
    },

    /**
     * Queue consumer: Processes reconciliation messages by calling the internal API.
     */
    async queue(
        batch: MessageBatch<{ eventId: string; organizationId: string }>,
        env: CloudflareBindings,
        _ctx: ExecutionContext
    ) {
        for (const message of batch.messages) {
            const { eventId, organizationId } = message.body;

            try {
                // Internal self-call to the retry endpoint
                const response = await app.request(
                    "/api/v1/internal/billing/retry-missed-payment",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Internal-Secret": env.INTERNAL_SECRET,
                        },
                        body: JSON.stringify({ eventId, organizationId }),
                    },
                    env
                );

                if (!response.ok) {
                    console.error(
                        `[Queue] Failed to retry payment ${eventId}: ${response.statusText}`
                    );
                    message.retry();
                } else {
                    const result: any = await response.json();
                    if (result.status === "failed") {
                        console.warn(
                            `[Queue] Reconciliation failed for ${eventId}: ${result.message}`
                        );
                        message.ack(); // ← prevents infinite Cloudflare Queue retry
                    } else {
                        console.log(`[Queue] Successfully reconciled payment ${eventId}`);
                        message.ack();
                    }
                }
            } catch (err) {
                console.error(`[Queue] Error processing message ${eventId}:`, err);
                message.retry();
            }
        }
    },
};
