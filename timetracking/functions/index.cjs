const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors");
const express = require("express");
const moment = require('moment-timezone');

const app = express();

// Enable CORS for all routes
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HCM Time Tracking API is running");
});

/**
 * Calculate all time metrics for an attendance record
 */
function calculateTimeMetrics(attendance, schedule) {
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

function getScheduledTime(dateMoment, timeString, timezone) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const scheduledTime = dateMoment.clone()
    .hour(hours)
    .minute(minutes)
    .second(0)
    .millisecond(0);
  return scheduledTime;
}

function calculateLate(punchIn, shiftStart) {
  if (punchIn.isSameOrBefore(shiftStart)) {
    return 0;
  }
  return punchIn.diff(shiftStart, 'minutes');
}

function calculateUndertime(punchOut, shiftEnd) {
  if (punchOut.isSameOrAfter(shiftEnd)) {
    return 0;
  }
  return shiftEnd.diff(punchOut, 'minutes');
}

function calculateRegularHours(punchIn, punchOut, shiftStart, shiftEnd, scheduledMinutes) {
  const effectiveStart = punchIn.isAfter(shiftStart) ? punchIn : shiftStart;
  const effectiveEnd = punchOut.isBefore(shiftEnd) ? punchOut : shiftEnd;

  if (effectiveEnd.isSameOrBefore(effectiveStart)) {
    return 0;
  }

  const regularMinutes = effectiveEnd.diff(effectiveStart, 'minutes');
  return Math.min(regularMinutes, scheduledMinutes);
}

function calculateOvertime(punchIn, punchOut, shiftEnd, totalWorkedMinutes, scheduledMinutes) {
  if (punchOut.isSameOrBefore(shiftEnd)) {
    return 0;
  }
  const overtimeMinutes = punchOut.diff(shiftEnd, 'minutes');
  return overtimeMinutes;
}

function calculateNightDifferential(punchIn, punchOut) {
  let nightMinutes = 0;
  let currentTime = punchIn.clone();
  const endTime = punchOut.clone();

  while (currentTime.isBefore(endTime)) {
    const hour = currentTime.hour();
    if (hour >= 22 || hour < 6) {
      nightMinutes++;
    }
    currentTime.add(1, 'minute');
  }

  return nightMinutes;
}

function batchCalculateTimeMetrics(attendanceRecords, userSchedule) {
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

/**
 * POST /api/calculate-time
 * Calculate time metrics for a single attendance record
 */
app.post("/api/calculate-time", (req, res) => {
  try {
    const { punchIn, punchOut, schedule } = req.body;

    console.log('=== Time Calculation Request ===');
    console.log('Punch In:', punchIn);
    console.log('Punch Out:', punchOut);
    console.log('Schedule:', schedule);

    if (!punchIn || !punchOut) {
      return res.status(400).json({
        error: "Missing required fields: punchIn and punchOut are required"
      });
    }

    if (!schedule || !schedule.start || !schedule.end) {
      return res.status(400).json({
        error: "Missing schedule information: start and end times are required"
      });
    }

    const metrics = calculateTimeMetrics(
      { punchIn, punchOut },
      schedule
    );

    console.log('Calculated Metrics:', metrics);
    console.log('================================\n');

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Calculation Error:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/calculate-time-batch
 * Calculate time metrics for multiple attendance records
 */
app.post("/api/calculate-time-batch", (req, res) => {
  try {
    const { attendanceRecords, schedule } = req.body;

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        error: "attendanceRecords must be an array"
      });
    }

    if (!schedule || !schedule.start || !schedule.end) {
      return res.status(400).json({
        error: "Missing schedule information: start and end times are required"
      });
    }

    const results = batchCalculateTimeMetrics(attendanceRecords, schedule);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Export the Express app as a Cloud Function
exports.api = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  app
);
