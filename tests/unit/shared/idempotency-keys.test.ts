import { IdempotencyKeys } from "@shared";
import { describe, expect, it } from "vitest";

describe("IdempotencyKeys Factory", () => {
    describe("sessionPayment", () => {
        it("returns the correctly formatted key", () => {
            const result = IdempotencyKeys.sessionPayment("ses_123", "usr_456");
            expect(result).toBe("session_payment:ses_123:usr_456");
        });

        it("throws when sessionId is an empty string", () => {
            expect(() => IdempotencyKeys.sessionPayment("", "usr_456")).toThrow(
                "IdempotencyKey: sessionId must not be empty"
            );
        });

        it("throws when sessionId is only whitespace", () => {
            expect(() => IdempotencyKeys.sessionPayment("   ", "usr_456")).toThrow(
                "IdempotencyKey: sessionId must not be empty"
            );
        });

        it("throws when userId is an empty string", () => {
            expect(() => IdempotencyKeys.sessionPayment("ses_123", "")).toThrow(
                "IdempotencyKey: userId must not be empty"
            );
        });
    });

    describe("refund", () => {
        it("returns the correctly formatted key", () => {
            const result = IdempotencyKeys.refund("tx_999");
            expect(result).toBe("refund:tx_999");
        });

        it("throws when originalTransactionId is empty", () => {
            expect(() => IdempotencyKeys.refund("")).toThrow(
                "IdempotencyKey: originalTransactionId must not be empty"
            );
        });
    });

    describe("walletTopup", () => {
        it("returns the correctly formatted key", () => {
            const result = IdempotencyKeys.walletTopup("usr_1", "req_A");
            expect(result).toBe("topup:usr_1:req_A");
        });
    });

    describe("billingCharge", () => {
        it("returns the correctly formatted key", () => {
            const result = IdempotencyKeys.billingCharge("org_77", "2024-04");
            expect(result).toBe("billing:org_77:2024-04");
        });
    });
});
