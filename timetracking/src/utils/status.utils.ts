/**
 * Status Utility Functions for Punch Status
 */

import type { PunchStatus } from '../types';

/**
 * Get status badge color classes
 */
export function getStatusColor(status: PunchStatus): string {
  switch (status) {
    case 'regular':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'OT':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'ND':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'late':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'undertime':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get readable status label
 */
export function getStatusLabel(status: PunchStatus): string {
  switch (status) {
    case 'OT':
      return 'Overtime';
    case 'ND':
      return 'Night Diff';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Determine punch status based on metrics
 */
export function determinePunchStatus(
  overtimeHours: number,
  nightDiffHours: number,
  lateMinutes: number,
  undertimeMinutes: number
): PunchStatus {
  if (overtimeHours > 0) return 'OT';
  if (nightDiffHours > 0) return 'ND';
  if (lateMinutes > 0) return 'late';
  if (undertimeMinutes > 0) return 'undertime';
  return 'regular';
}
