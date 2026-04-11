import { describe, expect, it } from "vitest";
import { calculateClassChargeCents, resolveOverdraftLimit } from "../../shared/utils/billing";

describe("calculateClassChargeCents", () => {
    it("rounds a fractional result to nearest cent", () => {
        // 1.1666 * 60 * 5 = 349.98 → rounds to 350
        // Wait, the user's example was: 1.1666 * 60 * 5 = 349.998 → rounds to 350
        // Actually 1.1666 * 300 = 349.98
        // Let's use the user's exact cases.
        expect(calculateClassChargeCents(1.1666, 60, 5)).toBe(350);
    });

    it("does not round a clean result", () => {
        expect(calculateClassChargeCents(2, 30, 1)).toBe(60);
    });

    it("rounds 0.5 up", () => {
        expect(calculateClassChargeCents(0.5, 1, 1)).toBe(1);
    });

    it("rounds 0.4 down", () => {
        expect(calculateClassChargeCents(0.4, 1, 1)).toBe(0);
    });
});

describe("resolveOverdraftLimit", () => {
    it("defers to billing plan if account is 0", () => {
        const account = { overdraftLimitCents: 0 };
        const plan = { overdraftLimitCents: 1000 };
        expect(resolveOverdraftLimit(account, plan)).toBe(1000);
    });

    it("uses account limit if account is > 0", () => {
        const account = { overdraftLimitCents: 500 };
        const plan = { overdraftLimitCents: 1000 };
        expect(resolveOverdraftLimit(account, plan)).toBe(500);
    });

    it("defaults to 0 if no plan and account is 0", () => {
        const account = { overdraftLimitCents: 0 };
        expect(resolveOverdraftLimit(account, null)).toBe(0);
        expect(resolveOverdraftLimit(account, undefined)).toBe(0);
    });

    it("defaults to 0 if both are 0", () => {
        const account = { overdraftLimitCents: 0 };
        const plan = { overdraftLimitCents: 0 };
        expect(resolveOverdraftLimit(account, plan)).toBe(0);
    });
});
