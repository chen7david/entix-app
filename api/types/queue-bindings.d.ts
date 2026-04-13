declare namespace Cloudflare {
    interface Env {
        QUEUE: Queue<import("../queues/entix.queue").EntixQueueMessage>;
        DLQ: Queue<import("../queues/entix.queue").EntixQueueMessage>;
    }
}
