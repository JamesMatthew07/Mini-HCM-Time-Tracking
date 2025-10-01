import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { calculateTimeMetrics, batchCalculateTimeMetrics } from "./timeCalculator.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HCM Time Tracking API is running");
});

/**
 * POST /api/calculate-time
 * Calculate time metrics for a single attendance record
 *
 * Body:
 * {
 *   "punchIn": "2025-09-30T09:15:00Z",
 *   "punchOut": "2025-09-30T19:30:00Z",
 *   "schedule": {
 *     "start": "09:00",
 *     "end": "18:00",
 *     "timezone": "America/New_York"
 *   }
 * }
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
 *
 * Body:
 * {
 *   "attendanceRecords": [
 *     {
 *       "punchIn": "2025-09-30T09:15:00Z",
 *       "punchOut": "2025-09-30T19:30:00Z"
 *     },
 *     ...
 *   ],
 *   "schedule": {
 *     "start": "09:00",
 *     "end": "18:00",
 *     "timezone": "America/New_York"
 *   }
 * }
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
