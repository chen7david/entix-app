import { enqueueMissedPayments } from "./handlers/missed-payments.scheduled";
import { retryStuckVocabularyProcessing } from "./handlers/vocabulary-retry.scheduled";

// cron expression → handler
// Configure cron triggers in wrangler.json under "triggers": { "crons": ["* * * * *"] }
const SCHEDULED_HANDLERS: Record<string, (env: CloudflareBindings) => Promise<void>> = {
    "* * * * *": async (env) => {
        await enqueueMissedPayments(env);
        await retryStuckVocabularyProcessing(env);
    },
};

export async function routeScheduled(
    controller: ScheduledController,
    env: CloudflareBindings,
    _ctx: ExecutionContext
): Promise<void> {
    const handler = SCHEDULED_HANDLERS[controller.cron];

    if (!handler) {
        console.warn(`[Scheduled] No handler for cron: ${controller.cron}`);
        return;
    }

    await handler(env);
}
