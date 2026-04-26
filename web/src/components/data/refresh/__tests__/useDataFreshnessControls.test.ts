import { describe, expect, it } from "vitest";
import { getFreshnessInfo } from "../useDataFreshnessControls";

describe("getFreshnessInfo", () => {
    it("returns idle before first fetch", () => {
        const freshness = getFreshnessInfo(undefined, 1_700_000_000_000);
        expect(freshness.status).toBe("idle");
        expect(freshness.label).toBe("Not fetched yet");
    });

    it("returns fresh for recent fetch", () => {
        const now = 1_700_000_000_000;
        const freshness = getFreshnessInfo(now - 5_000, now);
        expect(freshness.status).toBe("fresh");
        expect(freshness.label).toBe("Refreshed 5s ago");
    });

    it("returns stale after 5 minutes", () => {
        const now = 1_700_000_000_000;
        const freshness = getFreshnessInfo(now - 6 * 60 * 1000, now);
        expect(freshness.status).toBe("stale");
        expect(freshness.label).toContain("Refreshed");
    });
});
