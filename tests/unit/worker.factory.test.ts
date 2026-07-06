import { env } from "cloudflare:test";
import {
    getPaymentQueueRepositoryFromEnv,
    getSessionPaymentServiceFromEnv,
    getWorkerDb,
} from "@api/factories/worker.factory";
import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { describe, expect, it } from "vitest";

describe("worker.factory", () => {
    const bindings = env as unknown as CloudflareBindings;

    it("getWorkerDb returns a drizzle client", () => {
        const db = getWorkerDb(bindings);
        expect(db).toBeDefined();
        expect(typeof db.select).toBe("function");
    });

    it("getPaymentQueueRepositoryFromEnv returns PaymentQueueRepository", () => {
        const repo = getPaymentQueueRepositoryFromEnv(bindings);
        expect(repo).toBeInstanceOf(PaymentQueueRepository);
    });

    it("getSessionPaymentServiceFromEnv returns SessionPaymentService", () => {
        const service = getSessionPaymentServiceFromEnv(bindings);
        expect(service).toBeInstanceOf(SessionPaymentService);
    });
});
