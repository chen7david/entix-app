import type { EntixQueueMessage } from "./entix.queue";
import { EntixQueueHandler } from "./entix.queue";

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

    // Gemini RPM (10/min, retries included) is enforced in AiService via KV — no inter-message delay here.
    for (const message of batch.messages) {
        await EntixQueueHandler.process(message, env, _ctx);
    }
}
