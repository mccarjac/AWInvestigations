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
 * @throws Error if dateString is not in valid YYYY-MM-DD format or represents an invalid date
 */
export const parseDateString = (dateString: string): Date => {
  // Validate format: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error(
      `Invalid date format: "${dateString}". Expected YYYY-MM-DD format.`
    );
  }

  // Split the date string to get year, month, and day
  const parts = dateString.split('-').map(Number);
  const [year, month, day] = parts;

  // Validate numeric values
  if (parts.some(isNaN)) {
    throw new Error(
      `Invalid date values in: "${dateString}". All parts must be numeric.`
    );
  }

  // Create a date in the local timezone (month is 0-indexed in JavaScript)
  const date = new Date(year, month - 1, day);

  // Validate that the date is valid and matches the input
  // (catches cases like Feb 30, month 13, etc.)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(
      `Invalid date: "${dateString}". The date does not exist in the calendar.`
    );
  }

  return date;
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
