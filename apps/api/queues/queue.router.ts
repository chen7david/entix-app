import type { EntixQueueMessage } from "./entix.queue";
import { EntixQueueHandler } from "./entix.queue";

const INTER_REQUEST_DELAY_MS = 2_000; // 2 seconds between AI calls

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function routeQueue(
    batch: MessageBatch<EntixQueueMessage>,
    env: CloudflareBindings,
    _ctx: ExecutionContext
): Promise<void> {
    // All envs route to the same handler — queue name varies by env, logic doesn't
    if (!batch.queue.startsWith("entix-queue")) {
        console.error(`[Queue] No handler registered for queue: ${batch.queue}`);
        batch.ackAll();
        return;
    }

    for (let i = 0; i < batch.messages.length; i++) {
        const message = batch.messages[i];
        await EntixQueueHandler.process(message, env, _ctx);
        if (i < batch.messages.length - 1) {
            await sleep(INTER_REQUEST_DELAY_MS);
        }
    }
}
