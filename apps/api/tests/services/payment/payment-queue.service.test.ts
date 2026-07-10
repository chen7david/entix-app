import type { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { PaymentQueueService } from "@api/services/payment/payment-queue.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEnqueueInput } from "../../helpers/payment-test.helper";

describe("PaymentQueueService", () => {
    let service: PaymentQueueService;
    let mockRepo: Record<string, any>;
    let mockQueue: any;

    beforeEach(() => {
        mockRepo = {
            enqueue: vi.fn(),
            findById: vi.fn(),
        } as unknown as PaymentQueueRepository;

        mockQueue = {
            send: vi.fn().mockResolvedValue(undefined),
            sendBatch: vi.fn().mockResolvedValue(undefined),
        };

        service = new PaymentQueueService(mockRepo as any, mockQueue);
    });

    describe("enqueue()", () => {
        const input = createEnqueueInput();

        it("returns paymentRequestId and dispatches queue message when unique", async () => {
            const mockRecord = { id: "pr_generated_001" };
            mockRepo.enqueue.mockResolvedValue(mockRecord);

            const result = await service.enqueue(input);

            expect(result).toEqual({ paymentRequestId: "pr_generated_001" });
            expect(mockQueue.send).toHaveBeenCalledWith({
                type: "billing.process-payment",
                paymentRequestId: "pr_generated_001",
            });
        });

        it("returns null and DOES NOT dispatch queue message on duplicate", async () => {
            mockRepo.enqueue.mockResolvedValue(null);

            const result = await service.enqueue(input);
            expect(result).toBeNull();
            expect(mockQueue.send).not.toHaveBeenCalled();
        });
    });

    describe("getPaymentRequest()", () => {
        it("returns the request if found", async () => {
            const mockRecord = { id: "pr_123", status: "pending" };
            mockRepo.findById.mockResolvedValue(mockRecord);

            const result = await service.getPaymentRequest("pr_123");
            expect(result).toEqual(mockRecord);
        });

        it("throws NotFoundError if not found", async () => {
            mockRepo.findById.mockResolvedValue(null);

            await expect(service.getPaymentRequest("pr_missing")).rejects.toThrow(
                "Payment request pr_missing not found"
            );
        });
    });
});
