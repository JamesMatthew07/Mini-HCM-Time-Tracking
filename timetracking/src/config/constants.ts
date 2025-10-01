/**
 * Application Constants
 */

export const APP_NAME = 'Mini HCM Time Tracking';

export const DEFAULT_SCHEDULE = {
  start: '09:00',
  end: '18:00',
  timezone: 'Asia/Manila'
};

export const DEFAULT_TIMEZONE = 'Asia/Manila';

export const NIGHT_DIFF_START_HOUR = 22; // 10:00 PM
export const NIGHT_DIFF_END_HOUR = 6; // 6:00 AM

export const ADMIN_CREDENTIALS = {
  email: 'admin@company.com',
  password: 'admin123'
};

export const POSITION_OPTIONS = [
  'Software Engineer',
  'Product Manager',
  'Designer',
  'Marketing Specialist'
];

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY_LONG: 'MMMM D, YYYY',
  DISPLAY_SHORT: 'MMM D, YYYY',
  TIME_12H: 'h:mm A',
  TIME_24H: 'HH:mm'
};

export const COLLECTIONS = {
  USERS: 'users',
  ATTENDANCE: 'attendance',
  DAILY_SUMMARY: 'dailySummary'
};

export const ATTENDANCE_TYPES = {
  PUNCH_IN: 'punch_in',
  PUNCH_OUT: 'punch_out',
  COMPLETED: 'completed'
} as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  EMPLOYEE: 'employee'
} as const;

export const PUNCH_STATUSES = {
  REGULAR: 'regular',
  OVERTIME: 'OT',
  NIGHT_DIFF: 'ND',
  LATE: 'late',
  UNDERTIME: 'undertime'
} as const;
