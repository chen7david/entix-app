import { DateUtils } from "@web/src/utils/date";

export type DatePresetOption = {
    label: string;
    start: number;
    end: number;
};

export function getPresetFromRange(
    presets: DatePresetOption[],
    start: number,
    end: number
): string | null {
    const matched = presets.find((preset) => preset.start === start && preset.end === end);
    return matched?.label ?? null;
}

export function getRangeFromPreset(
    presets: DatePresetOption[],
    presetLabel: string | null | undefined
): { start: number; end: number } | null {
    if (!presetLabel) return null;
    const matched = presets.find((preset) => preset.label === presetLabel);
    if (!matched) return null;
    return { start: matched.start, end: matched.end };
}

export function toIsoRange(start: number, end: number) {
    return {
        startDate: DateUtils.toLibDate(start).toISOString(),
        endDate: DateUtils.toLibDate(end).toISOString(),
    };
}
