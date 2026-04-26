import { DateUtils } from "@web/src/utils/date";
import { describe, expect, it } from "vitest";
import { normalizeDatePresetFilters } from "../useDatePresetFilter";

const PRESETS = [
    { label: "Today", start: DateUtils.startOf("day"), end: DateUtils.endOf("day") },
    {
        label: "This Week",
        start: DateUtils.startOf("week"),
        end: DateUtils.endOf("week"),
    },
];

describe("normalizeDatePresetFilters", () => {
    it("keeps custom preset when user selects custom without changing range", () => {
        const todayIso = {
            startDate: DateUtils.toLibDate(DateUtils.startOf("day")).toISOString(),
            endDate: DateUtils.toLibDate(DateUtils.endOf("day")).toISOString(),
        };

        const previous = { preset: "Today", ...todayIso };
        const next = { preset: "__custom", ...todayIso };

        const normalized = normalizeDatePresetFilters({
            nextFilters: next,
            previousFilters: previous,
            presetOptions: PRESETS,
        });

        expect(normalized.preset).toBe("__custom");
    });

    it("applies range when user selects a named preset", () => {
        const previous = {
            preset: "__custom",
            startDate: DateUtils.toLibDate(DateUtils.offsetStartOf(-7, "day", "day")).toISOString(),
            endDate: DateUtils.toLibDate(DateUtils.offsetEndOf(-7, "day", "day")).toISOString(),
        };
        const next = { ...previous, preset: "Today" };

        const normalized = normalizeDatePresetFilters({
            nextFilters: next,
            previousFilters: previous,
            presetOptions: PRESETS,
        });

        expect(normalized.startDate).toBe(
            DateUtils.toLibDate(DateUtils.startOf("day")).toISOString()
        );
        expect(normalized.endDate).toBe(DateUtils.toLibDate(DateUtils.endOf("day")).toISOString());
    });

    it("derives preset from changed range", () => {
        const previous = {
            preset: "__custom",
            startDate: DateUtils.toLibDate(DateUtils.offsetStartOf(-2, "day", "day")).toISOString(),
            endDate: DateUtils.toLibDate(DateUtils.offsetEndOf(-2, "day", "day")).toISOString(),
        };
        const next = {
            ...previous,
            startDate: DateUtils.toLibDate(DateUtils.startOf("week")).toISOString(),
            endDate: DateUtils.toLibDate(DateUtils.endOf("week")).toISOString(),
        };

        const normalized = normalizeDatePresetFilters({
            nextFilters: next,
            previousFilters: previous,
            presetOptions: PRESETS,
        });

        expect(normalized.preset).toBe("This Week");
    });
});
