import { DateUtils } from "@web/src/utils/date";
import { useEffect, useMemo, useState } from "react";
import {
    type DatePresetOption,
    getPresetFromRange,
    getRangeFromPreset,
    toIsoRange,
} from "./datePresetAdapter";

type NormalizeDatePresetFilterArgs = {
    nextFilters: Record<string, any>;
    previousFilters: Record<string, any>;
    presetOptions: DatePresetOption[];
    customPresetValue?: string;
    presetKey?: string;
    startDateKey?: string;
    endDateKey?: string;
};

type UseDatePresetFilterStateArgs = {
    presetOptions: DatePresetOption[];
    startDate?: number | null;
    endDate?: number | null;
    customPresetValue?: string;
};

export function normalizeDatePresetFilters({
    nextFilters,
    previousFilters,
    presetOptions,
    customPresetValue = "__custom",
    presetKey = "preset",
    startDateKey = "startDate",
    endDateKey = "endDate",
}: NormalizeDatePresetFilterArgs): Record<string, any> {
    const normalized = { ...nextFilters };
    const nextPreset = (normalized[presetKey] as string | null) ?? null;
    const prevPreset = (previousFilters[presetKey] as string | null) ?? null;
    const presetChanged = nextPreset !== prevPreset;
    const rangeChanged =
        (normalized[startDateKey] ?? null) !== (previousFilters[startDateKey] ?? null) ||
        (normalized[endDateKey] ?? null) !== (previousFilters[endDateKey] ?? null);

    if (presetChanged && nextPreset && nextPreset !== customPresetValue) {
        const presetRange = getRangeFromPreset(presetOptions, nextPreset);
        if (presetRange) {
            const isoRange = toIsoRange(presetRange.start, presetRange.end);
            normalized[startDateKey] = isoRange.startDate;
            normalized[endDateKey] = isoRange.endDate;
        }
    }

    const hasCompleteRange = normalized[startDateKey] && normalized[endDateKey];
    const shouldDerivePresetFromRange = hasCompleteRange && (!presetChanged || rangeChanged);

    if (shouldDerivePresetFromRange) {
        const matchedPreset = getPresetFromRange(
            presetOptions,
            DateUtils.startOf("day", normalized[startDateKey]),
            DateUtils.endOf("day", normalized[endDateKey])
        );
        normalized[presetKey] = matchedPreset ?? customPresetValue;
    }

    return normalized;
}

export function useDatePresetFilterState({
    presetOptions,
    startDate,
    endDate,
    customPresetValue = "__custom",
}: UseDatePresetFilterStateArgs) {
    const derivedPreset = useMemo(() => {
        if (!startDate || !endDate) return customPresetValue;
        return getPresetFromRange(presetOptions, startDate, endDate) ?? customPresetValue;
    }, [customPresetValue, endDate, presetOptions, startDate]);

    const [selectedPreset, setSelectedPreset] = useState<string | null>(derivedPreset);

    useEffect(() => {
        if (selectedPreset !== customPresetValue) {
            setSelectedPreset(derivedPreset);
        }
    }, [customPresetValue, derivedPreset, selectedPreset]);

    const isoRange = useMemo(
        () =>
            startDate && endDate
                ? toIsoRange(startDate, endDate)
                : { startDate: null, endDate: null },
        [endDate, startDate]
    );

    return {
        customPresetValue,
        selectedPreset,
        setSelectedPreset,
        derivedPreset,
        isoRange,
    };
}
