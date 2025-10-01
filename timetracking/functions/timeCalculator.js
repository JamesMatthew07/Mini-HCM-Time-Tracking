/**
 * Time Calculator Module
 *
 * This module provides functions to calculate various time metrics for employee attendance:
 * - Regular working hours
 * - Overtime hours
 * - Night differential hours
 * - Late arrival minutes
 * - Undertime (early departure) minutes
 *
 * @module timeCalculator
 */

import moment from 'moment-timezone';

/**
 * Calculate all time metrics for an attendance record
 * @param {Object} attendance - Attendance record
 * @param {Date} attendance.punchIn - Punch in timestamp
 * @param {Date} attendance.punchOut - Punch out timestamp
 * @param {Object} schedule - User's work schedule
 * @param {string} schedule.start - Shift start time (HH:MM format, e.g., "09:00")
 * @param {string} schedule.end - Shift end time (HH:MM format, e.g., "18:00")
 * @param {string} schedule.timezone - Timezone (e.g., "Asia/Manila")
 * @returns {Object} Calculated time metrics
 */
export function calculateTimeMetrics(attendance, schedule) {
  const { punchIn, punchOut } = attendance;
  const { start, end, timezone = 'UTC' } = schedule;

  if (!punchIn || !punchOut) {
    throw new Error('Both punchIn and punchOut are required');
  }

  // Convert to moment objects in the specified timezone
  const punchInTime = moment(punchIn).tz(timezone);
  const punchOutTime = moment(punchOut).tz(timezone);

  // Get scheduled shift times for the punch-in date in the specified timezone
  const shiftStart = getScheduledTime(punchInTime, start, timezone);
  const shiftEnd = getScheduledTime(punchInTime, end, timezone);

  // Calculate late time (minutes after shift start)
  const lateMinutes = calculateLate(punchInTime, shiftStart);

  // Calculate undertime (minutes before shift end)
  const undertimeMinutes = calculateUndertime(punchOutTime, shiftEnd);

  // Calculate actual work hours using moment
  const totalWorkedMinutes = punchOutTime.diff(punchInTime, 'minutes');

  // Calculate scheduled shift duration
  const scheduledMinutes = shiftEnd.diff(shiftStart, 'minutes');

  // Calculate regular hours (up to scheduled shift, minus late and undertime)
  const regularMinutes = calculateRegularHours(
    punchInTime,
    punchOutTime,
    shiftStart,
    shiftEnd,
    scheduledMinutes
  );

  // Calculate overtime (work beyond scheduled shift)
  const overtimeMinutes = calculateOvertime(
    punchInTime,
    punchOutTime,
    shiftEnd,
    totalWorkedMinutes,
    scheduledMinutes
  );

  // Calculate night differential (work between 22:00-06:00)
  const nightDiffMinutes = calculateNightDifferential(punchInTime, punchOutTime);

  return {
    totalWorkedHours: (totalWorkedMinutes / 60).toFixed(2),
    totalWorkedMinutes,
    regularHours: (regularMinutes / 60).toFixed(2),
    regularMinutes,
    overtimeHours: (overtimeMinutes / 60).toFixed(2),
    overtimeMinutes,
    nightDiffHours: (nightDiffMinutes / 60).toFixed(2),
    nightDiffMinutes,
    lateMinutes,
    undertimeMinutes,
    punchInTime: punchInTime.toISOString(),
    punchOutTime: punchOutTime.toISOString(),
    shiftStart: shiftStart.toISOString(),
    shiftEnd: shiftEnd.toISOString(),
  };
}

/**
 * Get scheduled time for a specific date in the specified timezone
 * Creates a moment object with the same day but specified time
 *
 * @param {moment.Moment} dateMoment - The date to use
 * @param {string} timeString - Time in HH:MM format (e.g., "09:00")
 * @param {string} timezone - Timezone identifier (e.g., "Asia/Manila")
 * @returns {moment.Moment} Moment object with the scheduled time
 * @private
 */
function getScheduledTime(dateMoment, timeString, timezone) {
  const [hours, minutes] = timeString.split(':').map(Number);

  // Clone the date moment and set the time
  const scheduledTime = dateMoment.clone()
    .hour(hours)
    .minute(minutes)
    .second(0)
    .millisecond(0);

  return scheduledTime;
}

/**
 * Calculate late minutes (arrival after shift start)
 *
 * @param {moment.Moment} punchIn - Actual punch in time
 * @param {moment.Moment} shiftStart - Scheduled shift start time
 * @returns {number} Minutes late (0 if not late)
 * @private
 */
function calculateLate(punchIn, shiftStart) {
  if (punchIn.isSameOrBefore(shiftStart)) {
    return 0; // Not late
  }
  return punchIn.diff(shiftStart, 'minutes');
}

/**
 * Calculate undertime minutes (leaving before shift end)
 *
 * @param {moment.Moment} punchOut - Actual punch out time
 * @param {moment.Moment} shiftEnd - Scheduled shift end time
 * @returns {number} Minutes of undertime (0 if no undertime)
 * @private
 */
function calculateUndertime(punchOut, shiftEnd) {
  if (punchOut.isSameOrAfter(shiftEnd)) {
    return 0; // No undertime
  }
  return shiftEnd.diff(punchOut, 'minutes');
}

/**
 * Calculate regular hours (up to scheduled shift)
 * Regular hours are capped at the scheduled shift duration
 *
 * @param {moment.Moment} punchIn - Actual punch in time
 * @param {moment.Moment} punchOut - Actual punch out time
 * @param {moment.Moment} shiftStart - Scheduled shift start time
 * @param {moment.Moment} shiftEnd - Scheduled shift end time
 * @param {number} scheduledMinutes - Total scheduled shift duration in minutes
 * @returns {number} Regular work minutes
 * @private
 */
function calculateRegularHours(punchIn, punchOut, shiftStart, shiftEnd, scheduledMinutes) {
  // Effective start is the later of punch-in or shift start
  const effectiveStart = punchIn.isAfter(shiftStart) ? punchIn : shiftStart;

  // Effective end is the earlier of punch-out or shift end
  const effectiveEnd = punchOut.isBefore(shiftEnd) ? punchOut : shiftEnd;

  // If punch out is before shift start or punch in is after shift end, no regular hours
  if (effectiveEnd.isSameOrBefore(effectiveStart)) {
    return 0;
  }

  const regularMinutes = effectiveEnd.diff(effectiveStart, 'minutes');

  // Regular hours cannot exceed scheduled shift duration
  return Math.min(regularMinutes, scheduledMinutes);
}

/**
 * Calculate overtime (work beyond scheduled shift)
 * Only counts time worked after the scheduled shift end
 *
 * @param {moment.Moment} punchIn - Actual punch in time (unused but kept for consistency)
 * @param {moment.Moment} punchOut - Actual punch out time
 * @param {moment.Moment} shiftEnd - Scheduled shift end time
 * @param {number} totalWorkedMinutes - Total minutes worked (unused but kept for consistency)
 * @param {number} scheduledMinutes - Scheduled shift duration (unused but kept for consistency)
 * @returns {number} Overtime minutes
 * @private
 */
function calculateOvertime(punchIn, punchOut, shiftEnd, totalWorkedMinutes, scheduledMinutes) {
  // Only count overtime if punch out is after shift end
  if (punchOut.isSameOrBefore(shiftEnd)) {
    return 0;
  }

  const overtimeMinutes = punchOut.diff(shiftEnd, 'minutes');

  return overtimeMinutes;
}

/**
 * Calculate night differential (work between 22:00-06:00)
 * Counts all minutes worked during night differential hours
 * Night differential is defined as 10:00 PM (22:00) to 6:00 AM
 *
 * @param {moment.Moment} punchIn - Actual punch in time
 * @param {moment.Moment} punchOut - Actual punch out time
 * @returns {number} Night differential minutes
 * @private
 */
function calculateNightDifferential(punchIn, punchOut) {
  let nightMinutes = 0;

  // Iterate through each minute of work
  let currentTime = punchIn.clone();
  const endTime = punchOut.clone();

  while (currentTime.isBefore(endTime)) {
    const hour = currentTime.hour();

    // Check if current hour falls in night differential period (22:00-06:00)
    if (hour >= 22 || hour < 6) {
      nightMinutes++;
    }

    // Move to next minute
    currentTime.add(1, 'minute');
  }

  return nightMinutes;
}

/**
 * Batch calculate time metrics for multiple attendance records
 * Processes an array of attendance records and returns metrics for each
 *
 * @param {Array<{punchIn: string, punchOut: string}>} attendanceRecords - Array of attendance records
 * @param {Object} userSchedule - User's work schedule configuration
 * @param {string} userSchedule.start - Shift start time (HH:MM format)
 * @param {string} userSchedule.end - Shift end time (HH:MM format)
 * @param {string} userSchedule.timezone - Timezone identifier
 * @returns {Array<Object>} Array of records with calculated metrics or errors
 * @example
 * const records = [
 *   { punchIn: '2024-01-01T09:00:00Z', punchOut: '2024-01-01T18:00:00Z' }
 * ];
 * const schedule = { start: '09:00', end: '18:00', timezone: 'Asia/Manila' };
 * const results = batchCalculateTimeMetrics(records, schedule);
 */
export function batchCalculateTimeMetrics(attendanceRecords, userSchedule) {
  return attendanceRecords.map(record => {
    try {
      const metrics = calculateTimeMetrics(record, userSchedule);
      return {
        ...record,
        metrics,
        calculationError: null
      };
    } catch (error) {
      return {
        ...record,
        metrics: null,
        calculationError: error.message
      };
    }
  });
}
