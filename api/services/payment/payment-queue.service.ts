import type { EntixQueueMessage } from "@api/queues/entix.queue";
import type { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { generatePaymentRequestId, type NewPaymentRequest } from "@shared";
import { BaseService } from "../base.service";

export type EnqueuePaymentInput = Omit<
    NewPaymentRequest,
    "id" | "status" | "attemptCount" | "createdAt" | "updatedAt"
>;

/**
 * PaymentQueueService orchestrates the durable enqueueing of payment requests.
 * Following the "intent-first" pattern, it persists payment intents to the database
 * and dispatches them to a background worker for asynchronous processing.
 */
export class PaymentQueueService extends BaseService {
    constructor(
        private readonly paymentQueueRepo: PaymentQueueRepository,
        private readonly queue: Queue<EntixQueueMessage>
    ) {
        super();
    }

    /**
     * Persists a payment request to the database and dispatches a queue message for processing.
     * Uses idempotency keys to ensure that duplicate requests are ignored.
     *
     * @param input - The payment request details, excluding system-managed fields.
     * @returns The generated paymentRequestId, or null if a duplicate request was detected.
     */
    async enqueue(input: EnqueuePaymentInput): Promise<{ paymentRequestId: string } | null> {
        const paymentRequestId = generatePaymentRequestId();

        // 1. Attempt to persist the intent in the database.
        // The repository uses ON CONFLICT DO NOTHING on the idempotency key.
        const record = await this.paymentQueueRepo.enqueue({
            ...input,
            id: paymentRequestId,
            status: "pending",
            attemptCount: 0,
        });

        if (!record) {
            // Duplicate detected: the idempotency key was already present.
            return null;
        }

        // 2. Dispatch a message to the Cloudflare Queue for async processing.
        // This ensures the worker picks up the "pending" request.
        await this.queue.send({
            type: "billing.process-payment",
            paymentRequestId: record.id,
        });

        return { paymentRequestId: record.id };
    }

    /**
     * Helper to retrieve a payment request by ID.
     */
    async getPaymentRequest(id: string) {
        const pr = await this.paymentQueueRepo.findById(id);
        return this.assertExists(pr, `Payment request ${id} not found`);
    }
}
