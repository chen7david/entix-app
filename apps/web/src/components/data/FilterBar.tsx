import { RedoOutlined } from "@ant-design/icons";
import { Button, DatePicker, Segmented, Select, theme } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { SearchFilterControl } from "./filter-bar/SearchFilterControl";

type FilterOption = { label: string; value: string | number | boolean };

type BaseFilterConfig = {
    key: string;
    label?: string;
    placeholder?: string;
    minWidth?: number;
    hidden?: boolean;
    disabled?: boolean;
    visibleWhen?: (values: Record<string, any>) => boolean;
    disabledWhen?: (values: Record<string, any>) => boolean;
    customRender?: (ctx: {
        filter: FilterConfig;
        values: Record<string, any>;
        updateFilter: (key: string, value: any) => void;
        onChange: (nextFilters: Record<string, any>) => void;
    }) => ReactNode;
};

export type SearchFilterConfig = BaseFilterConfig & {
    type: "search";
    allowClear?: boolean;
    debounceMs?: number;
    showTypingIndicator?: boolean;
    typingIndicatorText?: string;
};

export type SelectFilterConfig = BaseFilterConfig & {
    type: "select";
    options?: FilterOption[];
    allowClear?: boolean;
    showSearch?: boolean;
};

export type SegmentedFilterConfig = BaseFilterConfig & {
    type: "segmented";
    options?: FilterOption[];
};

export type DateRangeFilterConfig = BaseFilterConfig & {
    type: "dateRange";
    keys: [string, string];
};

export type FilterConfig =
    | SearchFilterConfig
    | SelectFilterConfig
    | SegmentedFilterConfig
    | DateRangeFilterConfig;

type FilterBarProps = {
    filters: FilterConfig[];
    values: Record<string, any>;
    initialValues?: Record<string, any>;
    onChange: (nextFilters: Record<string, any>) => void;
    onReset?: () => void;
    showReset?: boolean;
    resetLabel?: ReactNode;
    className?: string;
    compact?: boolean;
    resetIconOnly?: boolean;
};

function hasAnyFilterSet(
    values: Record<string, any>,
    initialValues: Record<string, any> | undefined
): boolean {
    if (!initialValues) {
        return Object.values(values).some(
            (v) =>
                v !== undefined &&
                v !== "" &&
                v !== null &&
                (Array.isArray(v) ? v.length > 0 : true)
        );
    }

    const keys = new Set([...Object.keys(values), ...Object.keys(initialValues)]);
    for (const key of keys) {
        if (values[key] !== initialValues[key]) return true;
    }
    return false;
}

export function FilterBar({
    filters,
    values,
    initialValues,
    onChange,
    onReset,
    showReset = true,
    resetLabel = "Reset",
    className,
    compact = false,
    resetIconOnly = false,
}: FilterBarProps) {
    const { token } = theme.useToken();
    const hasFiltersSet = hasAnyFilterSet(values, initialValues);
    const visibleFilters = filters.filter((filter) => {
        if (filter.hidden) return false;
        if (filter.visibleWhen) return filter.visibleWhen(values);
        return true;
    });

    if (visibleFilters.length === 0) return null;

    const updateFilter = (key: string, value: any) => {
        onChange({
            ...values,
            [key]: value,
        });
    };

    return (
        <div
            className={`flex items-center flex-wrap px-0.5 ${compact ? "gap-2 mb-3" : "gap-3 mb-4"} ${className || ""}`}
        >
            {visibleFilters.map((filter) => (
                <div
                    key={filter.key}
                    className="flex-shrink-0"
                    style={{
                        minWidth: filter.minWidth ?? (filter.type === "dateRange" ? 280 : 200),
                    }}
                >
                    {filter.customRender ? (
                        filter.customRender({
                            filter,
                            values,
                            updateFilter,
                            onChange,
                        })
                    ) : filter.type === "search" ? (
                        <SearchFilterControl
                            placeholder={filter.placeholder}
                            value={values[filter.key] || ""}
                            allowClear={filter.allowClear}
                            disabled={
                                filter.disabled ||
                                (filter.disabledWhen ? filter.disabledWhen(values) : false)
                            }
                            debounceMs={filter.debounceMs}
                            showTypingIndicator={filter.showTypingIndicator}
                            typingIndicatorText={filter.typingIndicatorText}
                            onValueChange={(value) => updateFilter(filter.key, value)}
                        />
                    ) : filter.type === "dateRange" ? (
                        <DatePicker.RangePicker
                            variant="outlined"
                            className="w-full rounded-lg h-[40px]"
                            disabled={
                                filter.disabled ||
                                (filter.disabledWhen ? filter.disabledWhen(values) : false)
                            }
                            value={
                                values[filter.keys[0]] && values[filter.keys[1]]
                                    ? [dayjs(values[filter.keys[0]]), dayjs(values[filter.keys[1]])]
                                    : null
                            }
                            onChange={(dates) =>
                                onChange({
                                    ...values,
                                    [filter.keys[0]]: dates?.[0]?.toISOString() || null,
                                    [filter.keys[1]]: dates?.[1]?.toISOString() || null,
                                })
                            }
                        />
                    ) : filter.type === "select" ? (
                        <Select
                            variant="outlined"
                            placeholder={filter.placeholder || "All"}
                            className="w-full h-[40px]"
                            options={filter.options}
                            showSearch={filter.showSearch}
                            value={values[filter.key] ?? undefined}
                            onChange={(value) => updateFilter(filter.key, value)}
                            allowClear={filter.allowClear ?? true}
                            disabled={
                                filter.disabled ||
                                (filter.disabledWhen ? filter.disabledWhen(values) : false)
                            }
                        />
                    ) : filter.type === "segmented" ? (
                        <Segmented
                            block
                            options={filter.options || []}
                            value={values[filter.key] ?? filter.options?.[0]?.value ?? ""}
                            onChange={(value) => updateFilter(filter.key, value)}
                            className="rounded-lg p-0.5"
                            disabled={
                                filter.disabled ||
                                (filter.disabledWhen ? filter.disabledWhen(values) : false)
                            }
                        />
                    ) : null}
                </div>
            ))}

            {showReset && onReset && (
                <Button
                    icon={<RedoOutlined />}
                    onClick={onReset}
                    type="text"
                    className="flex items-center text-sm font-medium transition-all hover:bg-black/5 dark:hover:bg-white/10 h-[40px] px-3 rounded-lg"
                    style={{
                        color: hasFiltersSet ? token.colorTextSecondary : token.colorTextQuaternary,
                        opacity: hasFiltersSet ? 1 : 0.7,
                    }}
                    disabled={!hasFiltersSet}
                >
                    {!resetIconOnly ? resetLabel : null}
                </Button>
            )}
        </div>
    );
}
