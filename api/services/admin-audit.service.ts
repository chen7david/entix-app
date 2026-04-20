import type { EntixQueueMessage } from "@api/queues/entix.queue";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { BaseService } from "./base.service";

type AuditQueueBinding = { send: (body: EntixQueueMessage) => Promise<void> };

/**
 * Admin-facing audit operations (list, acknowledge, requeue flows).
 * Handlers delegate here instead of touching repositories or `db` directly.
 */
export class AdminAuditService extends BaseService {
    constructor(
        private readonly auditRepo: SystemAuditRepository,
        private readonly queue: AuditQueueBinding
    ) {
        super();
    }

    list(filters: Parameters<SystemAuditRepository["list"]>[0]) {
        return this.auditRepo.list(filters);
    }

    acknowledge(id: string, userId: string | undefined) {
        return this.auditRepo.acknowledge(id, userId || "system", new Date());
    }

    /**
     * Enqueues a billing retry and marks the reconciliation audit row acknowledged for UI consistency.
     */
    async requeueFailedPayment(
        eventId: string,
        organizationId: string,
        userId: string | undefined
    ) {
        const msg: EntixQueueMessage = {
            type: "billing.retry-missed-payment",
            eventId,
            organizationId,
        };
        await this.queue.send(msg);
        await this.auditRepo.setAcknowledged(eventId, {
            at: new Date(),
            acknowledgedBy: userId || "system",
            organizationId,
        });
    }
}
