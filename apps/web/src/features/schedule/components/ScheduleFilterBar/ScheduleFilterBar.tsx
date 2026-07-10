import { FilterBar, type FilterConfig } from "@web/src/components/data/FilterBar";
import {
    type DatePresetOption,
    getRangeFromPreset,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import { useDatePresetFilterState } from "@web/src/components/data/filter-bar/useDatePresetFilter";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { DateUtils } from "@web/src/utils/date";
import type React from "react";
import { useMemo } from "react";
import type { TimelineFilter } from "../../hooks/useScheduleState";

const CUSTOM_RANGE_PRESET = "__custom";

type FilterValues = {
    search: string;
    timeline: TimelineFilter;
    startDate: string | null;
    endDate: string | null;
    preset: string | null;
};

type Props = {
    search: string;
    onSearchChange: (val: string) => void;
    isSearching?: boolean;
    startDate?: number;
    endDate?: number;
    onRangeChange: (dates: any) => void;
    timeline: TimelineFilter;
    onTimelineChange: (val: TimelineFilter) => void;
    onReset?: () => void;
};

export const ScheduleFilterBar: React.FC<Props> = ({
    search,
    onSearchChange,
    isSearching: _isSearching,
    startDate,
    endDate,
    onRangeChange,
    timeline,
    onTimelineChange,
    onReset,
}) => {
    const presetOptions = useMemo<DatePresetOption[]>(
        () => [
            { label: "Today", start: DateUtils.startOf("day"), end: DateUtils.endOf("day") },
            {
                label: "Tomorrow",
                start: DateUtils.offsetStartOf(1, "day", "day"),
                end: DateUtils.offsetEndOf(1, "day", "day"),
            },
            {
                label: "Last Week",
                start: DateUtils.offsetStartOf(-1, "week", "week"),
                end: DateUtils.offsetEndOf(-1, "week", "week"),
            },
            {
                label: "Next Week",
                start: DateUtils.offsetStartOf(1, "week", "week"),
                end: DateUtils.offsetEndOf(1, "week", "week"),
            },
            {
                label: "This Month",
                start: DateUtils.startOf("month"),
                end: DateUtils.endOf("month"),
            },
        ],
        []
    );
    const { selectedPreset, setSelectedPreset, isoRange } = useDatePresetFilterState({
        presetOptions,
        startDate,
        endDate,
        customPresetValue: CUSTOM_RANGE_PRESET,
    });

    const filters: FilterConfig[] = [
        {
            type: "search",
            key: "search",
            placeholder: "Search sessions...",
            minWidth: 200,
            debounceMs: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE,
            showTypingIndicator: true,
        },
        {
            type: "select",
            key: "preset",
            placeholder: "Custom Range",
            minWidth: 130,
            options: [
                ...presetOptions.map((preset) => ({ label: preset.label, value: preset.label })),
                { label: "Custom Range", value: CUSTOM_RANGE_PRESET },
            ],
            allowClear: false,
        },
        {
            type: "select",
            key: "timeline",
            minWidth: 120,
            options: [
                { label: "All Time", value: "All" },
                { label: "Upcoming", value: "Upcoming" },
                { label: "Past", value: "Past" },
                { label: "Next 5 Hours", value: "Next 5 Hours" },
                { label: "Last 5 Hours", value: "Last 5 Hours" },
            ],
            allowClear: false,
        },
        {
            type: "dateRange",
            key: "range",
            keys: ["startDate", "endDate"],
            minWidth: 280,
            visibleWhen: (values) => values.preset === CUSTOM_RANGE_PRESET,
        },
    ];

    const values: FilterValues = {
        search,
        timeline,
        startDate: isoRange.startDate,
        endDate: isoRange.endDate,
        preset: selectedPreset ?? CUSTOM_RANGE_PRESET,
    };
    const initialValues: FilterValues = {
        search: "",
        timeline: "Upcoming",
        startDate: DateUtils.toLibDate(DateUtils.startOf("day")).toISOString(),
        endDate: DateUtils.toLibDate(DateUtils.endOf("day")).toISOString(),
        preset: "Today",
    };

    const applyPreset = (preset: string | null) => {
        if (!preset || preset === CUSTOM_RANGE_PRESET) return;
        const presetRange = getRangeFromPreset(presetOptions, preset);
        if (presetRange) {
            onRangeChange([
                DateUtils.toLibDate(presetRange.start),
                DateUtils.toLibDate(presetRange.end),
            ]);
        }
    };

    const handleChange = (next: Record<string, any>) => {
        if (next.search !== search) onSearchChange(next.search || "");
        if (next.timeline !== timeline) onTimelineChange(next.timeline as TimelineFilter);
        if (next.preset !== values.preset) {
            const nextPreset = (next.preset as string | null) ?? null;
            setSelectedPreset(nextPreset);
            applyPreset(nextPreset);
        }

        if (next.startDate !== values.startDate || next.endDate !== values.endDate) {
            if (next.startDate && next.endDate) {
                onRangeChange([
                    DateUtils.toLibDate(new Date(next.startDate)),
                    DateUtils.toLibDate(new Date(next.endDate)),
                ]);
            }
        }
    };

    return (
        <FilterBar
            filters={filters}
            values={values}
            initialValues={initialValues}
            onChange={handleChange}
            onReset={onReset}
            className="mb-6"
        />
    );
};
