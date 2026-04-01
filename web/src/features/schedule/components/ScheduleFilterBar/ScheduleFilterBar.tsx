import { SearchOutlined } from "@ant-design/icons";
import { DateUtils } from "@web/src/utils/date";
import { DatePicker, Input, Select } from "antd";
import type React from "react";
import type { TimelineFilter } from "../../hooks/useScheduleState";

const { RangePicker } = DatePicker;

type Props = {
    search: string;
    onSearchChange: (val: string) => void;
    isSearching?: boolean;
    startDate?: number;
    endDate?: number;
    onRangeChange: (dates: any) => void;
    timeline: TimelineFilter;
    onTimelineChange: (val: TimelineFilter) => void;
};

export const ScheduleFilterBar: React.FC<Props> = ({
    search,
    onSearchChange,
    isSearching,
    startDate,
    endDate,
    onRangeChange,
    timeline,
    onTimelineChange,
}) => {
    return (
        <div className="flex items-center gap-4 flex-wrap mb-6">
            <Input
                placeholder="Search sessions..."
                prefix={<SearchOutlined />}
                style={{ maxWidth: 200 }}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                allowClear
                suffix={
                    isSearching ? (
                        <span className="text-xs text-gray-400 italic">typing...</span>
                    ) : null
                }
            />
            <Select
                value={
                    startDate === DateUtils.startOf("day") && endDate === DateUtils.endOf("day")
                        ? "Today"
                        : startDate === DateUtils.offsetStartOf(1, "day", "day") &&
                            endDate === DateUtils.offsetEndOf(1, "day", "day")
                          ? "Tomorrow"
                          : startDate === DateUtils.offsetStartOf(-1, "week", "week") &&
                              endDate === DateUtils.offsetEndOf(-1, "week", "week")
                            ? "Last Week"
                            : startDate === DateUtils.offsetStartOf(1, "week", "week") &&
                                endDate === DateUtils.offsetEndOf(1, "week", "week")
                              ? "Next Week"
                              : startDate === DateUtils.startOf("month") &&
                                  endDate === DateUtils.endOf("month")
                                ? "This Month"
                                : null
                }
                placeholder="Custom Range"
                onChange={(val) => {
                    if (val === "Today")
                        onRangeChange([
                            DateUtils.toLibDate(DateUtils.startOf("day")),
                            DateUtils.toLibDate(DateUtils.endOf("day")),
                        ]);
                    else if (val === "Tomorrow")
                        onRangeChange([
                            DateUtils.toLibDate(DateUtils.offsetStartOf(1, "day", "day")),
                            DateUtils.toLibDate(DateUtils.offsetEndOf(1, "day", "day")),
                        ]);
                    else if (val === "Last Week")
                        onRangeChange([
                            DateUtils.toLibDate(DateUtils.offsetStartOf(-1, "week", "week")),
                            DateUtils.toLibDate(DateUtils.offsetEndOf(-1, "week", "week")),
                        ]);
                    else if (val === "Next Week")
                        onRangeChange([
                            DateUtils.toLibDate(DateUtils.offsetStartOf(1, "week", "week")),
                            DateUtils.toLibDate(DateUtils.offsetEndOf(1, "week", "week")),
                        ]);
                    else if (val === "This Month")
                        onRangeChange([
                            DateUtils.toLibDate(DateUtils.startOf("month")),
                            DateUtils.toLibDate(DateUtils.endOf("month")),
                        ]);
                }}
                style={{ minWidth: 130 }}
                options={[
                    { label: "Today", value: "Today" },
                    { label: "Tomorrow", value: "Tomorrow" },
                    { label: "Last Week", value: "Last Week" },
                    { label: "Next Week", value: "Next Week" },
                    { label: "This Month", value: "This Month" },
                ]}
            />
            <Select
                value={timeline}
                onChange={onTimelineChange}
                style={{ minWidth: 120 }}
                options={[
                    { label: "All Time", value: "All" },
                    { label: "Upcoming", value: "Upcoming" },
                    { label: "Past", value: "Past" },
                    { label: "Next 5 Hours", value: "Next 5 Hours" },
                    { label: "Last 5 Hours", value: "Last 5 Hours" },
                ]}
            />
            <RangePicker
                onChange={onRangeChange}
                value={
                    [
                        startDate ? DateUtils.toLibDate(startDate) : null,
                        endDate ? DateUtils.toLibDate(endDate) : null,
                    ] as any
                }
                allowClear={false}
            />
        </div>
    );
};
