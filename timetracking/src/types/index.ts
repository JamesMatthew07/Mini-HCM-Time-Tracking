// /**
//  * Shared TypeScript type definitions for the Time Tracking application
//  */

export interface User {
  name: string;
  email: string;
  role: 'user' | 'admin' | 'employee';
  position?: string;
  userId?: string;
  timezone?: string;
  schedule?: Schedule;
}

export interface Schedule {
  start: string;
  end: string;
  timezone?: string;
}

export interface TimeEntry {
  id: string;
  punchIn: Date;
  punchOut?: Date;
  duration?: number;
  metrics?: TimeMetrics;
}

export interface TimeMetrics {
  totalWorkedHours: string;
  totalWorkedMinutes?: number;
  regularHours: string;
  regularMinutes?: number;
  overtimeHours: string;
  overtimeMinutes?: number;
  nightDiffHours: string;
  nightDiffMinutes?: number;
  lateMinutes: number;
  undertimeMinutes: number;
}

export interface Punch {
  id: string;
  employeeName: string;
  date: string;
  punchIn: string;
  punchOut: string;
  status: PunchStatus;
  totalHours: string;
}

export type PunchStatus = 'regular' | 'OT' | 'ND' | 'late' | 'undertime';

export interface DailyReport {
  employeeName: string;
  regular: string;
  overtime: string;
  nightDiff: string;
  late: string;
  undertime: string;
  total: string;
}

export interface WeeklyReport {
  employeeName: string;
  regularHours: string;
  overtimeHours: string;
  nightDiffHours: string;
  lateMinutes: string;
  undertimeMinutes: string;
  totalHours: string;
}

export interface AttendanceRecord {
  userId: string;
  userEmail: string;
  userName: string;
  punchIn: any;
  punchOut?: any;
  type: 'punch_in' | 'punch_out' | 'completed';
  timestamp: any;
  date: string;
  duration?: number;
  metrics?: TimeMetrics;
  relatedSessionId?: string;
}

export interface DailySummary {
  userId: string;
  date: string;
  totalWorkedHours: string;
  regularHours: string;
  overtimeHours: string;
  nightDiffHours: string;
  totalLateMinutes: number;
  totalUndertimeMinutes: number;
  createdAt?: any;
  lastUpdated?: any;
}

export interface FormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  position?: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  position?: string;
}
