import { FilterBar, type FilterConfig } from "@web/src/components/data/FilterBar";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { DateUtils } from "@web/src/utils/date";
import type React from "react";
import type { TimelineFilter } from "../../hooks/useScheduleState";

const CUSTOM_RANGE_PRESET = "__custom";

type FilterValues = {
    search: string;
    timeline: TimelineFilter;
    startDate: string | null;
    endDate: string | null;
    preset: string | null;
};

function getPresetValue(startDate?: number, endDate?: number): string | null {
    if (startDate === DateUtils.startOf("day") && endDate === DateUtils.endOf("day"))
        return "Today";
    if (
        startDate === DateUtils.offsetStartOf(1, "day", "day") &&
        endDate === DateUtils.offsetEndOf(1, "day", "day")
    )
        return "Tomorrow";
    if (
        startDate === DateUtils.offsetStartOf(-1, "week", "week") &&
        endDate === DateUtils.offsetEndOf(-1, "week", "week")
    )
        return "Last Week";
    if (
        startDate === DateUtils.offsetStartOf(1, "week", "week") &&
        endDate === DateUtils.offsetEndOf(1, "week", "week")
    )
        return "Next Week";
    if (startDate === DateUtils.startOf("month") && endDate === DateUtils.endOf("month"))
        return "This Month";
    return null;
}

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
                { label: "Today", value: "Today" },
                { label: "Tomorrow", value: "Tomorrow" },
                { label: "Last Week", value: "Last Week" },
                { label: "Next Week", value: "Next Week" },
                { label: "This Month", value: "This Month" },
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
        startDate: startDate ? DateUtils.toLibDate(startDate).toISOString() : null,
        endDate: endDate ? DateUtils.toLibDate(endDate).toISOString() : null,
        preset: getPresetValue(startDate, endDate) ?? CUSTOM_RANGE_PRESET,
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
        if (preset === "Today") {
            onRangeChange([
                DateUtils.toLibDate(DateUtils.startOf("day")),
                DateUtils.toLibDate(DateUtils.endOf("day")),
            ]);
        } else if (preset === "Tomorrow") {
            onRangeChange([
                DateUtils.toLibDate(DateUtils.offsetStartOf(1, "day", "day")),
                DateUtils.toLibDate(DateUtils.offsetEndOf(1, "day", "day")),
            ]);
        } else if (preset === "Last Week") {
            onRangeChange([
                DateUtils.toLibDate(DateUtils.offsetStartOf(-1, "week", "week")),
                DateUtils.toLibDate(DateUtils.offsetEndOf(-1, "week", "week")),
            ]);
        } else if (preset === "Next Week") {
            onRangeChange([
                DateUtils.toLibDate(DateUtils.offsetStartOf(1, "week", "week")),
                DateUtils.toLibDate(DateUtils.offsetEndOf(1, "week", "week")),
            ]);
        } else if (preset === "This Month") {
            onRangeChange([
                DateUtils.toLibDate(DateUtils.startOf("month")),
                DateUtils.toLibDate(DateUtils.endOf("month")),
            ]);
        }
    };

    const handleChange = (next: Record<string, any>) => {
        if (next.search !== search) onSearchChange(next.search || "");
        if (next.timeline !== timeline) onTimelineChange(next.timeline as TimelineFilter);
        if (next.preset !== values.preset) applyPreset((next.preset as string | null) ?? null);

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
