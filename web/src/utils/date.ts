import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Initialize plugins globally
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export type DateUnit = "day" | "week" | "month" | "year" | "minute" | "hour";

/**
 * A centralized, vendor-agnostic absolute date manipulator shielding
 * the overarching Front-End React components from explicit DayJS dependencies.
 */
export const DateUtils = {
    now: () => Date.now(),

    // Boundary calculations (always returning Epoch ms for generic interoperability)
    startOf: (unit: DateUnit, date?: number | string | Date) =>
        dayjs.tz(date).startOf(unit).valueOf(),
    endOf: (unit: DateUnit, date?: number | string | Date) => dayjs.tz(date).endOf(unit).valueOf(),

    // Shift calculations (e.g. "Tomorrow" = offsetStartOf(1, 'day', 'day'))
    offsetStartOf: (
        amount: number,
        unit: DateUnit,
        startUnit: DateUnit,
        date?: number | string | Date
    ) => dayjs.tz(date).add(amount, unit).startOf(startUnit).valueOf(),
    offsetEndOf: (
        amount: number,
        unit: DateUnit,
        endUnit: DateUnit,
        date?: number | string | Date
    ) => dayjs.tz(date).add(amount, unit).endOf(endUnit).valueOf(),

    // Math
    addMinutes: (date: number | string | Date, minutes: number) =>
        dayjs.tz(date).add(minutes, "minute").valueOf(),

    // Formatting rules
    format: (date: number | string | Date, template: string) => dayjs.tz(date).format(template),
    fromNow: (date: number | string | Date) => dayjs.tz(date).fromNow(),
    toDate: (date: number | string | Date) => dayjs.tz(date).toDate(),

    // Timezone
    setTimezone: (tz: string) => dayjs.tz.setDefault(tz),
    getTimezoneOffset: (tz: string) => dayjs().tz(tz).format("Z"), // Returns generic offsets like "-04:00"

    // Component-level GUI integration hooks preventing leaks directly into library core structures
    toLibDate: (date: number | string | Date) => dayjs.tz(date),
};
