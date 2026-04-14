import { EntixQueueHandler, type EntixQueueMessage } from "@api/queues/entix.queue";
import * as schema from "@shared/db/schema";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

/**
 * Test helper to synchronously drain the entix-queue.
 * Useful for integration tests that trigger asynchronous payment flows.
 *
 * @param env - The cloudflare environment bindings (including DB).
 */
export async function drainQueue(env: CloudflareBindings) {
    const db = drizzle(env.DB, { schema });

    // 1. Fetch all pending or processing requests
    const pendingRequests = await db
        .select()
        .from(schema.paymentRequests)
        .where(inArray(schema.paymentRequests.status, ["pending", "processing"]));

    if (pendingRequests.length === 0) return;

    // 2. Mock ExecutionContext with a working waitUntil that tracks failures
    const pendingPromises: Promise<unknown>[] = [];
    const executionCtx: ExecutionContext = {
        waitUntil: (p: Promise<unknown>) => {
            pendingPromises.push(
                p.catch((err) => {
                    console.error("[drainQueue] waitUntil promise failed:", err);
                    throw err;
                })
            );
        },
        passThroughOnException: () => {},
        // @ts-expect-error - Some environments expect these
        exports: {},
        props: {},
    };

    // 3. Process each request synchronously through the handler
    for (const pr of pendingRequests) {
        let didAck = false;
        let didRetry = false;

        const message: Message<EntixQueueMessage> = {
            id: `msg_${pr.id}`,
            body: {
                type: "billing.process-payment",
                paymentRequestId: pr.id,
            },
            attempts: 1,
            timestamp: new Date(),
            ack: () => {
                didAck = true;
            },
            retry: () => {
                didRetry = true;
            },
        };

        await EntixQueueHandler.process(message, env, executionCtx);

        // Surface consumer errors in test output immediately
        if (didRetry) {
            throw new Error(
                `Queue consumer requested retry for payment request ${pr.id}. Check logs for details.`
            );
        }

        if (!didAck) {
            throw new Error(
                `Queue consumer logic hole: Message for payment request ${pr.id} was neither acknowledged nor retried.`
            );
        }
    }

    // 4. Wait for any background tasks scheduled via waitUntil
    await Promise.all(pendingPromises);
}
