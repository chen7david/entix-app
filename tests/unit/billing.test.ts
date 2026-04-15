import { calculateClassChargeCents } from "@shared";
import { describe, expect, it } from "vitest";

describe("calculateClassChargeCents", () => {
    it("calculates basic rate without rounding", () => {
        // $6.67/min * 45 mins = 30015 cents ($300.15)
        expect(calculateClassChargeCents(667, 45)).toBe(30015);
    });

    it("rounds to nearest dollar when option is enabled", () => {
        // $6.67/min * 45 mins = 30015 cents ($300.15) -> rounds to $300.00
        expect(calculateClassChargeCents(667, 45, { roundToNearestDollar: true })).toBe(30000);

        // $10.51 -> $11.00
        expect(calculateClassChargeCents(1051, 1, { roundToNearestDollar: true })).toBe(1100);

        // $10.49 -> $10.00
        expect(calculateClassChargeCents(1049, 1, { roundToNearestDollar: true })).toBe(1000);
    });

    it("handles zero duration and rate", () => {
        expect(calculateClassChargeCents(0, 45)).toBe(0);
        expect(calculateClassChargeCents(667, 0)).toBe(0);
        expect(calculateClassChargeCents(0, 45, { roundToNearestDollar: true })).toBe(0);
    });
});
