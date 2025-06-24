import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'HH:mm',
  DATETIME: 'MM/DD/YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
  RELATIVE: 'relative',
} as const;

/**
 * Format a date using the specified format
 */
export const formatDate = (
  date: Date | string | number,
  format: keyof typeof DATE_FORMATS | string = 'SHORT',
): string => {
  const dateObj = dayjs(date);

  if (!dateObj.isValid()) {
    return 'Invalid Date';
  }

  if (format === 'relative') {
    return dateObj.fromNow();
  }

  const formatString = DATE_FORMATS[format as keyof typeof DATE_FORMATS] || format;
  return dateObj.format(formatString);
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string | number): boolean => {
  return dayjs(date).isBefore(dayjs());
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string | number): boolean => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * Get the difference between two dates in days
 */
export const getDaysDifference = (date1: Date | string | number, date2: Date | string | number): number => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

/**
 * Get a human-readable time ago string
 */
export const getTimeAgo = (date: Date | string | number): string => {
  return dayjs(date).fromNow();
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Check if a date is yesterday
 */
export const isYesterday = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

/**
 * Get the start of a day
 */
export const getStartOfDay = (date: Date | string | number): Date => {
  return dayjs(date).startOf('day').toDate();
};

/**
 * Get the end of a day
 */
export const getEndOfDay = (date: Date | string | number): Date => {
  return dayjs(date).endOf('day').toDate();
};
