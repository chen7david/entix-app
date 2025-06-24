/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 */
export const toTitleCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Convert string to camel case
 */
export const toCamelCase = (str: string): string => {
  if (!str) return str;
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

/**
 * Convert string to kebab case
 */
export const toKebabCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-+|-+$/g, '');
};

/**
 * Convert string to snake case
 */
export const toSnakeCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_+|_+$/g, '');
};

/**
 * Truncate string to specified length
 */
export const truncate = (str: string, length: number, suffix = '...'): string => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * Remove HTML tags from string
 */
export const stripHtml = (str: string): string => {
  if (!str) return str;
  return str.replace(/<[^>]*>/g, '');
};

/**
 * Generate a random string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Check if string contains only letters
 */
export const isAlpha = (str: string): boolean => {
  return /^[a-zA-Z]+$/.test(str);
};

/**
 * Check if string contains only numbers
 */
export const isNumeric = (str: string): boolean => {
  return /^[0-9]+$/.test(str);
};

/**
 * Check if string contains only letters and numbers
 */
export const isAlphanumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Count words in a string
 */
export const countWords = (str: string): number => {
  if (!str) return 0;
  return str.trim().split(/\s+/).length;
};

/**
 * Count characters in a string (excluding spaces)
 */
export const countCharacters = (str: string): number => {
  if (!str) return 0;
  return str.replace(/\s/g, '').length;
};

/**
 * Reverse a string
 */
export const reverse = (str: string): string => {
  if (!str) return str;
  return str.split('').reverse().join('');
};

/**
 * Check if string is palindrome
 */
export const isPalindrome = (str: string): boolean => {
  if (!str) return true;
  const cleanStr = str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  return cleanStr === reverse(cleanStr);
};
