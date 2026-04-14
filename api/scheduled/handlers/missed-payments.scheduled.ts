import { getPaymentQueueRepository } from "@api/factories/repository.factory";
import type { AppContext } from "@api/helpers/types.helpers";
import type { EntixQueueMessage } from "@api/queues/entix.queue";

/**
 * Scheduled task to reconcile "stuck" payment requests.
 * Scans for requests that have been in the 'pending' state for more than 5 minutes
 * and re-enqueues them to the processing queue.
 */
export async function enqueueMissedPayments(env: CloudflareBindings): Promise<void> {
    const ctx = { env } as AppContext;
    const paymentQueueRepo = getPaymentQueueRepository(ctx);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find all requests that haven't been picked up by a worker yet
    const pendingRequests = await paymentQueueRepo.findPendingOlderThan(fiveMinutesAgo);

    for (const pr of pendingRequests) {
        const msg: EntixQueueMessage = {
            type: "billing.process-payment",
            paymentRequestId: pr.id,
        };
        await env.QUEUE.send(msg);
    }

    if (pendingRequests.length > 0) {
        console.log(
            `[Scheduled:MissedPayments] Re-enqueued ${pendingRequests.length} legacy pending payments`
        );
    }
}
