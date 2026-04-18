import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Initialize plugins globally
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export type DateUnit = "day" | "week" | "month" | "year" | "minute" | "hour";

const ISO_OFFSET_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;
const LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

let activeTimezone = DEFAULT_TIMEZONE;
dayjs.tz.setDefault(activeTimezone);

/**
 * Parses incoming values into an absolute instant.
 * ISO datetime strings without timezone info are treated as UTC to avoid local offset drift.
 */
const parseDateValue = (date?: number | string | Date) => {
    if (date === undefined) {
        return dayjs();
    }

    if (typeof date === "string") {
        const normalizedDate = date.trim();
        if (
            LOCAL_DATETIME_PATTERN.test(normalizedDate) &&
            !ISO_OFFSET_PATTERN.test(normalizedDate)
        ) {
            return dayjs.utc(normalizedDate);
        }
    }

    return dayjs(date);
};

/**
 * Converts an absolute instant into the currently active timezone.
 */
const toActiveTimezone = (date?: number | string | Date) => parseDateValue(date).tz(activeTimezone);

/**
 * A centralized, vendor-agnostic absolute date manipulator shielding
 * the overarching Front-End React components from explicit DayJS dependencies.
 */
export const DateUtils = {
    now: () => Date.now(),

    // Boundary calculations (always returning Epoch ms for generic interoperability)
    startOf: (unit: DateUnit, date?: number | string | Date) =>
        toActiveTimezone(date).startOf(unit).valueOf(),
    endOf: (unit: DateUnit, date?: number | string | Date) =>
        toActiveTimezone(date).endOf(unit).valueOf(),

    // Shift calculations (e.g. "Tomorrow" = offsetStartOf(1, 'day', 'day'))
    offsetStartOf: (
        amount: number,
        unit: DateUnit,
        startUnit: DateUnit,
        date?: number | string | Date
    ) => toActiveTimezone(date).add(amount, unit).startOf(startUnit).valueOf(),
    offsetEndOf: (
        amount: number,
        unit: DateUnit,
        endUnit: DateUnit,
        date?: number | string | Date
    ) => toActiveTimezone(date).add(amount, unit).endOf(endUnit).valueOf(),

    // Math
    addMinutes: (date: number | string | Date, minutes: number) =>
        parseDateValue(date).add(minutes, "minute").valueOf(),

    // Formatting rules
    format: (date: number | string | Date, template: string) =>
        toActiveTimezone(date).format(template),
    fromNow: (date: number | string | Date) => parseDateValue(date).fromNow(),
    toDate: (date: number | string | Date) => toActiveTimezone(date).toDate(),

    // Timezone
    setTimezone: (tz: string) => {
        activeTimezone = tz || DEFAULT_TIMEZONE;
        dayjs.tz.setDefault(activeTimezone);
    },
    getTimezoneOffset: (tz: string) => dayjs().tz(tz).format("Z"), // Returns generic offsets like "-04:00"

    // Component-level GUI integration hooks preventing leaks directly into library core structures
    toLibDate: (date: number | string | Date) => toActiveTimezone(date),
};
