/**
 * API Service Layer
 * Handles all HTTP requests to the backend API
 */

import type { Schedule, TimeMetrics } from '../types';

// Use relative URL in production (Firebase rewrites handle /api/* routes)
// Use localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production' ? '' : 'https://time-tracking-60bab.web.app/');

interface TimeCalculationRequest {
  punchIn: string;
  punchOut: string;
  schedule: Schedule;
}

interface TimeCalculationResponse {
  success: boolean;
  data: TimeMetrics;
}

interface BatchTimeCalculationRequest {
  attendanceRecords: Array<{ punchIn: string; punchOut: string }>;
  schedule: Schedule;
}

interface BatchTimeCalculationResponse {
  success: boolean;
  data: Array<{
    punchIn: string;
    punchOut: string;
    metrics: TimeMetrics | null;
    calculationError: string | null;
  }>;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

export class ApiService {
  /**
   * Calculate time metrics for a single attendance record
   */
  static async calculateTimeMetrics(
    punchIn: Date,
    punchOut: Date,
    schedule: Schedule
  ): Promise<TimeMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          punchIn: punchIn.toISOString(),
          punchOut: punchOut.toISOString(),
          schedule
        } as TimeCalculationRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to calculate time metrics: ${errorText}`);
      }

      const result: TimeCalculationResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error calculating time metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate time metrics for multiple attendance records
   */
  static async batchCalculateTimeMetrics(
    attendanceRecords: Array<{ punchIn: string; punchOut: string }>,
    schedule: Schedule
  ): Promise<BatchTimeCalculationResponse['data']> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate-time-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attendanceRecords,
          schedule
        } as BatchTimeCalculationRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to batch calculate time metrics: ${errorText}`);
      }

      const result: BatchTimeCalculationResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error batch calculating time metrics:', error);
      throw error;
    }
  }

  /**
   * Check API health status
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }

  /**
   * Get API base URL (useful for debugging)
   */
  static getBaseUrl(): string {
    return API_BASE_URL;
  }
}
