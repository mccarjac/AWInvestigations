/**
 * Utility functions for handling dates in the application.
 * These functions ensure consistent date parsing and formatting across the app,
 * avoiding timezone-related issues.
 */

/**
 * Parses a date string in YYYY-MM-DD format without timezone conversion.
 * This ensures that a date like "2025-11-11" is always interpreted as November 11,
 * regardless of the user's timezone.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the local date (without timezone conversion)
 */
export const parseDateString = (dateString: string): Date => {
  // Split the date string to get year, month, and day
  const [year, month, day] = dateString.split('-').map(Number);

  // Create a date in the local timezone (month is 0-indexed in JavaScript)
  return new Date(year, month - 1, day);
};

/**
 * Formats a date string in YYYY-MM-DD format to a human-readable format.
 * Uses local date parsing to avoid timezone issues.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Optional time string in HH:MM format
 * @param options - Optional Intl.DateTimeFormatOptions to customize formatting
 * @returns Formatted date string
 */
export const formatEventDate = (
  dateString: string,
  timeString?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = parseDateString(dateString);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  const dateStr = date.toLocaleDateString('en-US', defaultOptions);
  return timeString ? `${dateStr} at ${timeString}` : dateStr;
};

/**
 * Formats a date string in YYYY-MM-DD format to a short format.
 * Uses local date parsing to avoid timezone issues.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Optional time string in HH:MM format
 * @returns Short formatted date string (e.g., "Nov 11, 2025")
 */
export const formatEventDateShort = (
  dateString: string,
  timeString?: string
): string => {
  const date = parseDateString(dateString);

  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return timeString ? `${dateStr} at ${timeString}` : dateStr;
};
