# Queues & Scheduled Tasks

Entix-App uses Cloudflare Workers' background processing capabilities to handle long-running or periodic tasks asynchronously. This ensures that user-facing HTTP requests remain fast and responsive.

## 1. Cloudflare Queues

Cloudflare Queues deliver batched messages to the Worker. All background jobs share a **single queue** (`entix-queue`) and are distinguished by a `type` discriminator on the message body. A Dead Letter Queue (`entix-dlq`) automatically receives messages that fail after `max_retries: 3`.

### How It Works

1. **Entry Point**: Cloudflare delivers batched messages to the `queue()` export in `api/main.ts`.
2. **Routing**: `api/queues/queue.router.ts` forwards all batches that match `entix-queue*` to `EntixQueueHandler`.
3. **Dispatch**: `EntixQueueHandler.process()` in `api/queues/entix.queue.ts` uses an **exhaustive switch** on `message.body.type` to call the correct private handler function.
4. **DLQ**: After `max_retries` (currently 3) failed `message.retry()` calls, Cloudflare automatically moves the message to `entix-dlq-*` for inspection.

Cloudflare automatically scales Worker instances horizontally based on queue depth — no manual concurrency configuration is needed.

### Queue Infrastructure (per env)

| Environment | Queue                    | DLQ                       |
|-------------|--------------------------|---------------------------|
| development | `entix-queue-dev`        | `entix-dlq-dev`           |
| staging     | `entix-queue-staging`    | `entix-dlq-staging`       |
| production  | `entix-queue-production` | `entix-dlq-production`    |

### Adding a New Message Type

All new work is **purely additive** — you never need to create a new queue.

#### 1. Add a type to the union in `entix.queue.ts`

```ts
export type EntixQueueMessage =
    | { type: "billing.retry-missed-payment"; eventId: string; organizationId: string }
    | { type: "media.process-upload"; uploadId: string; orgId: string }; // ← add here
```

#### 2. Add a case to the switch

```ts
case "media.process-upload":
    return handleMediaUpload(message as ..., env);
```

TypeScript will emit a **compile error** if the switch is not exhaustive — the `default: never` guard catches it.

#### 3. Implement the private handler function

```ts
async function handleMediaUpload(
    message: Message<Extract<EntixQueueMessage, { type: "media.process-upload" }>>,
    env: CloudflareBindings
): Promise<void> {
    // ...
}
```

No `wrangler.jsonc` changes needed — the queue and bindings already exist.

---

## 2. Scheduled Tasks (Crons)

Scheduled tasks allow you to run logic at specific time intervals using cron expressions.

### How It Works

1. **Entry Point**: Cloudflare triggers the `scheduled()` export in `api/main.ts` according to configured cron schedules.
2. **Routing**: `api/scheduled/scheduled.router.ts` dispatches the event to the appropriate handler based on `controller.cron`.
3. **Execution**: Handlers (in `api/scheduled/handlers/`) perform periodic logic such as enqueuing missed payments.

### Adding a New Scheduled Task

#### 1. Create the handler
Create `api/scheduled/handlers/<name>.scheduled.ts`:

```ts
export async function myCronTask(env: CloudflareBindings): Promise<void> {
    // Periodic logic here
}
```

#### 2. Register the handler
In `api/scheduled/scheduled.router.ts`, add the cron mapping:

```ts
const SCHEDULED_HANDLERS = {
    "* * * * *": myCronTask,
};
```

#### 3. Update Wrangler
In `wrangler.jsonc`, ensure your cron trigger is defined:

```jsonc
"triggers": {
    "crons": ["* * * * *"]
}
```

---

## ack() vs retry() Decision Guide

| Situation | Action | Rationale |
|---|---|---|
| Successfully processed | `message.ack()` | Removes message from queue. |
| Transient failure (network/timeout) | `message.retry()` | Re-queues the message; DLQ catches it after `max_retries`. |
| Permanent failure (business rule) | `message.ack()` | Log + write audit event; retrying won't fix it. |
| Unknown/unregistered queue prefix | `batch.ackAll()` | Prevents misconfigured queues from causing infinite loops. |

## Registered Background Tasks

| Type | Identifier | Purpose |
|---|---|---|
| Queue | `entix-queue*` | All async background jobs, routed by `message.body.type` |
| Scheduled | `* * * * *` | Scans for missed payments and enqueues them to `entix-queue` |

### Message Types Registered in `EntixQueueMessage`

| `type` field | Handler function | Purpose |
|---|---|---|
| `billing.retry-missed-payment` | `handleBillingRetry` | Calls `/internal/billing/retry-missed-payment` and writes an audit event on permanent failure |
