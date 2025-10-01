/**
 * Date and Time Utility Functions
 */

/**
 * Format time to 12-hour format with AM/PM
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format time to 12-hour format without seconds
 */
export function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date to long format (e.g., "Monday, January 1, 2024")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date to short format (e.g., "Jan 1, 2024")
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format duration from seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration from seconds to hours with decimal (e.g., "8.5 hrs")
 */
export function formatDurationHours(seconds: number): string {
  const hours = (seconds / 3600).toFixed(2);
  return `${hours} hrs`;
}

/**
 * Convert 12-hour time string to 24-hour format for datetime-local input
 */
export function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.trim().split(' ');
  const timeParts = time.split(':');
  const hoursStr = timeParts[0];
  const minutes = timeParts[1] || '00';
  let hours = parseInt(hoursStr, 10);

  if (hours === 12 && modifier === 'AM') {
    hours = 0;
  } else if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Get the start of the week for a given date (Sunday)
 */
export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get the end of the week for a given date (Saturday)
 */
export function getWeekEnd(date: Date): Date {
  const weekEnd = new Date(date);
  weekEnd.setDate(date.getDate() + (6 - date.getDay()));
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * Ensures consistent date formatting across the app
 */
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date object
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Get the date N days ago as ISO string
 */
export function getDaysAgoISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateISO(date);
}

/**
 * Get the date N days from now as ISO string
 */
export function getDaysFromNowISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}
