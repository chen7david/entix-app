import app from "@api/app";
import { getSystemAuditRepository } from "@api/factories/repository.factory";
import type { AppContext } from "@api/helpers/types.helpers";

// ─── Message Type Union ───────────────────────────────────────────────────────

// biome-ignore format: single-member union required for exhaustive switch narrowing
export type EntixQueueMessage =
    | {
          type: "billing.retry-missed-payment";
          eventId: string;
          organizationId: string;
      };
// Add future message types here, e.g.:
// | { type: "media.process-upload"; uploadId: string; orgId: string }

// ─── Handler ─────────────────────────────────────────────────────────────────

export const EntixQueueHandler = {
    async process(message: Message<EntixQueueMessage>, env: CloudflareBindings): Promise<void> {
        const body = message.body;

        switch (body.type) {
            case "billing.retry-missed-payment":
                return handleBillingRetry(message, env);

            default: {
                const _exhaustive: never = body as never;
                console.error(`[Queue] Unknown message type:`, _exhaustive);
                message.ack();
            }
        }
    },
};

// ─── Billing Retry ────────────────────────────────────────────────────────────

async function handleBillingRetry(
    message: Message<Extract<EntixQueueMessage, { type: "billing.retry-missed-payment" }>>,
    env: CloudflareBindings
): Promise<void> {
    const { eventId, organizationId } = message.body;

    try {
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
            console.error(`[Queue:BillingRetry] HTTP error for ${eventId}: ${response.statusText}`);
            message.retry();
            return;
        }

        const result = (await response.json()) as { status: string; message: string };

        if (result.status === "failed") {
            // Permanent business failure — log to audit trail and ack to prevent infinite loop
            console.warn(
                `[Queue:BillingRetry] Permanent failure for ${eventId}: ${result.message}`
            );
            await writePermanentFailureAuditEvent(
                { eventId, organizationId, reason: result.message },
                env
            );
            message.ack();
        } else {
            console.log(`[Queue:BillingRetry] Reconciled ${eventId}`);
            message.ack();
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Queue:BillingRetry] Unhandled error for ${eventId}:`, errMsg);
        message.retry();
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writePermanentFailureAuditEvent(
    {
        eventId,
        organizationId,
        reason,
    }: { eventId: string; organizationId: string; reason: string },
    env: CloudflareBindings
): Promise<void> {
    try {
        // Build a minimal AppContext-compatible object to satisfy the factory
        const ctx = { env } as AppContext;
        const auditRepo = getSystemAuditRepository(ctx);
        await auditRepo.insert({
            id: crypto.randomUUID(),
            eventType: "payment.reconciliation-failed",
            severity: "critical",
            subjectType: "payment_event",
            subjectId: eventId,
            organizationId,
            message: `Queue reconciliation permanently failed: ${reason}`,
            metadata: JSON.stringify({ eventId, organizationId, reason }),
        });
    } catch (err) {
        // Never let an audit write failure crash the queue handler
        console.error(`[Queue:BillingRetry] Failed to write audit event for ${eventId}:`, err);
    }
}
