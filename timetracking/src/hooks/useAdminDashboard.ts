/**
 * useAdminDashboard Hook
 * Custom hook for admin dashboard logic
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api.service';
import { FirebaseService } from '../services/firebase.service';
import type { DailyReport, Punch, TimeMetrics, WeeklyReport } from '../types';
import { convertTo24Hour } from '../utils/date.utils';
import { determinePunchStatus } from '../utils/status.utils';

export function useAdminDashboard(selectedDate: string, activeTab: 'punches' | 'daily' | 'weekly') {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch attendance data for selected date
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('=== Admin Fetching Attendance ===');
      console.log('Selected Date:', selectedDate);

      const attendanceRecords = await FirebaseService.getAttendanceByDate(selectedDate);
      console.log('Documents found:', attendanceRecords.length);

      // Fetch user names for all records
      const punchPromises = attendanceRecords.map(async (record) => {
        const userName = await FirebaseService.getUserName(record.userId || record.userEmail);

        const punchInDate = record.punchIn?.toDate
          ? record.punchIn.toDate()
          : new Date(record.punchInTime || record.punchIn);
        const punchOutDate = record.punchOut?.toDate
          ? record.punchOut.toDate()
          : new Date(record.punchOutTime || record.punchOut);

        // Determine status based on metrics
        const metrics = record.metrics || {};
        const overtimeHours = parseFloat(metrics.overtimeHours || 0);
        const nightDiffHours = parseFloat(metrics.nightDiffHours || 0);
        const lateMinutes = metrics.lateMinutes || 0;
        const undertimeMinutes = metrics.undertimeMinutes || 0;

        const status = determinePunchStatus(
          overtimeHours,
          nightDiffHours,
          lateMinutes,
          undertimeMinutes
        );

        return {
          id: record.id,
          employeeName: userName,
          date: record.date,
          punchIn: punchInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          punchOut: punchOutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status,
          totalHours: metrics.totalWorkedHours || '0.00'
        };
      });

      const resolvedPunches = await Promise.all(punchPromises);

      // Sort by punch in time (newest first)
      resolvedPunches.sort((a, b) => {
        const aRecord = attendanceRecords.find(r => r.id === a.id);
        const bRecord = attendanceRecords.find(r => r.id === b.id);

        const aTime = aRecord?.punchIn?.toDate ? aRecord.punchIn.toDate() : new Date(aRecord?.punchInTime || aRecord?.punchIn);
        const bTime = bRecord?.punchIn?.toDate ? bRecord.punchIn.toDate() : new Date(bRecord?.punchInTime || bRecord?.punchIn);

        return bTime.getTime() - aTime.getTime(); // Newest first
      });

      setPunches(resolvedPunches);
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch daily reports
  const fetchDailyReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('=== Admin Fetching Daily Reports ===');
      console.log('Selected Date:', selectedDate);

      const summaries = await FirebaseService.getDailySummariesByDate(selectedDate);
      console.log('Daily summaries found:', summaries.length);
      console.log('Daily summaries data:', summaries);

      const reportPromises = summaries.map(async (summary) => {
        const userName = await FirebaseService.getUserName(summary.userId || summary.userEmail);

        // Safely handle NaN and undefined values
        const safeNumber = (value: any, decimals: number = 2): string => {
          const num = parseFloat(value);
          return isNaN(num) ? '0.00' : num.toFixed(decimals);
        };

        const safeInt = (value: any): string => {
          const num = parseInt(value);
          return isNaN(num) ? '0' : num.toString();
        };

        return {
          employeeName: userName,
          regular: safeNumber(summary.regularHours),
          overtime: safeNumber(summary.overtimeHours),
          nightDiff: safeNumber(summary.nightDiffHours),
          late: safeInt(summary.totalLateMinutes),
          undertime: safeInt(summary.totalUndertimeMinutes),
          total: safeNumber(summary.totalWorkedHours)
        };
      });

      const resolvedReports = await Promise.all(reportPromises);
      setDailyReports(resolvedReports);
    } catch (error) {
      console.error('❌ Error fetching daily reports:', error);
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch weekly reports
  const fetchWeeklyReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('=== Admin Fetching Weekly Reports ===');
      console.log('Selected Date:', selectedDate);

      // Calculate week range
      const selectedDateObj = new Date(selectedDate);
      const weekStart = new Date(selectedDateObj);
      weekStart.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      console.log('Week range:', startStr, 'to', endStr);

      const summaries = await FirebaseService.getDailySummariesByDateRange(startStr, endStr);
      console.log('Weekly summaries found:', summaries.length);
      console.log('Weekly summaries data:', summaries);

      const userWeeklySummary: Record<string, WeeklyReport> = {};

      // Helper to safely parse numbers
      const safeParseFloat = (value: any): number => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      };

      const safeParseInt = (value: any): number => {
        const num = parseInt(value);
        return isNaN(num) ? 0 : num;
      };

      summaries.forEach((summary) => {
        const userId = summary.userId;

        if (!userWeeklySummary[userId]) {
          userWeeklySummary[userId] = {
            employeeName: userId,
            regularHours: '0.00',
            overtimeHours: '0.00',
            nightDiffHours: '0.00',
            lateMinutes: '0',
            undertimeMinutes: '0',
            totalHours: '0.00'
          };
        }

        const report = userWeeklySummary[userId];
        report.regularHours = (
          safeParseFloat(report.regularHours) + safeParseFloat(summary.regularHours)
        ).toFixed(2);
        report.overtimeHours = (
          safeParseFloat(report.overtimeHours) + safeParseFloat(summary.overtimeHours)
        ).toFixed(2);
        report.nightDiffHours = (
          safeParseFloat(report.nightDiffHours) + safeParseFloat(summary.nightDiffHours)
        ).toFixed(2);
        report.lateMinutes = (
          safeParseInt(report.lateMinutes) + safeParseInt(summary.totalLateMinutes)
        ).toString();
        report.undertimeMinutes = (
          safeParseInt(report.undertimeMinutes) + safeParseInt(summary.totalUndertimeMinutes)
        ).toString();
        report.totalHours = (
          safeParseFloat(report.totalHours) + safeParseFloat(summary.totalWorkedHours)
        ).toFixed(2);
      });

      // Fetch user names
      const userIds = Object.keys(userWeeklySummary);
      await Promise.all(
        userIds.map(async (userId) => {
          const userName = await FirebaseService.getUserName(userId);
          userWeeklySummary[userId].employeeName = userName;
        })
      );

      setWeeklyReports(Object.values(userWeeklySummary));
    } catch (error) {
      console.error('Error fetching weekly reports:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Delete punch handler
  const handleDeletePunch = async (punchId: string) => {
    if (!window.confirm('Are you sure you want to delete this punch record?')) {
      return;
    }

    try {
      const punchData = await FirebaseService.getAttendanceById(punchId);
      if (!punchData) {
        alert('Punch record not found');
        return;
      }

      const metrics = punchData.metrics;
      const userId = punchData.userId || punchData.userEmail;
      const date = punchData.date;

      await FirebaseService.deleteAttendance(punchId);

      // Update daily summary if metrics exist
      if (metrics && userId && date) {
        const summary = await FirebaseService.getDailySummary(userId, date);

        if (summary) {
          const updatedSummary = {
            totalWorkedHours: Math.max(
              0,
              parseFloat(summary.totalWorkedHours || '0') - parseFloat(metrics.totalWorkedHours || '0')
            ).toFixed(2),
            regularHours: Math.max(
              0,
              parseFloat(summary.regularHours || '0') - parseFloat(metrics.regularHours || '0')
            ).toFixed(2),
            overtimeHours: Math.max(
              0,
              parseFloat(summary.overtimeHours || '0') - parseFloat(metrics.overtimeHours || '0')
            ).toFixed(2),
            nightDiffHours: Math.max(
              0,
              parseFloat(summary.nightDiffHours || '0') - parseFloat(metrics.nightDiffHours || '0')
            ).toFixed(2),
            totalLateMinutes: Math.max(0, (summary.totalLateMinutes || 0) - (metrics.lateMinutes || 0)),
            totalUndertimeMinutes: Math.max(
              0,
              (summary.totalUndertimeMinutes || 0) - (metrics.undertimeMinutes || 0)
            )
          };

          const allZero =
            parseFloat(updatedSummary.totalWorkedHours) === 0 &&
            parseFloat(updatedSummary.regularHours) === 0 &&
            parseFloat(updatedSummary.overtimeHours) === 0 &&
            parseFloat(updatedSummary.nightDiffHours) === 0 &&
            updatedSummary.totalLateMinutes === 0 &&
            updatedSummary.totalUndertimeMinutes === 0;

          if (allZero) {
            await FirebaseService.deleteDailySummary(userId, date);
          } else {
            await FirebaseService.updateDailySummary(userId, date, updatedSummary as unknown as TimeMetrics);
          }
        }
      }

      alert('Punch record deleted successfully');
      fetchAttendanceData();
      if (activeTab === 'daily') fetchDailyReports();
      if (activeTab === 'weekly') fetchWeeklyReports();
    } catch (error) {
      console.error('Error deleting punch:', error);
      alert('Failed to delete punch record');
    }
  };

  // Edit punch handler
  const handleSaveEdit = async (
    punchId: string,
    punchInStr: string,
    punchOutStr: string,
    date: string
  ) => {
    try {
      const punchInDate = new Date(punchInStr);
      const punchOutDate = new Date(punchOutStr);

      const existingData = await FirebaseService.getAttendanceById(punchId);
      if (!existingData) {
        alert('Punch record not found');
        return;
      }

      // Recalculate metrics
      const calculatedMetrics = await ApiService.calculateTimeMetrics(punchInDate, punchOutDate, {
        start: '09:00',
        end: '18:00',
        timezone: 'Asia/Manila'
      });

      await FirebaseService.updateAttendance(punchId, punchInDate, punchOutDate, date, calculatedMetrics);

      // Update daily summary
      if (existingData.metrics && existingData.userId && existingData.date) {
        const summary = await FirebaseService.getDailySummary(existingData.userId, existingData.date);

        if (summary) {
          const oldMetrics = existingData.metrics;
          const updatedSummary = {
            totalWorkedHours: Math.max(
              0,
              parseFloat(summary.totalWorkedHours || '0') -
                parseFloat(oldMetrics.totalWorkedHours || '0') +
                parseFloat(calculatedMetrics.totalWorkedHours || '0')
            ).toFixed(2),
            regularHours: Math.max(
              0,
              parseFloat(summary.regularHours || '0') -
                parseFloat(oldMetrics.regularHours || '0') +
                parseFloat(calculatedMetrics.regularHours || '0')
            ).toFixed(2),
            overtimeHours: Math.max(
              0,
              parseFloat(summary.overtimeHours || '0') -
                parseFloat(oldMetrics.overtimeHours || '0') +
                parseFloat(calculatedMetrics.overtimeHours || '0')
            ).toFixed(2),
            nightDiffHours: Math.max(
              0,
              parseFloat(summary.nightDiffHours || '0') -
                parseFloat(oldMetrics.nightDiffHours || '0') +
                parseFloat(calculatedMetrics.nightDiffHours || '0')
            ).toFixed(2),
            totalLateMinutes: Math.max(
              0,
              (summary.totalLateMinutes || 0) -
                (oldMetrics.lateMinutes || 0) +
                (calculatedMetrics.lateMinutes || 0)
            ),
            totalUndertimeMinutes: Math.max(
              0,
              (summary.totalUndertimeMinutes || 0) -
                (oldMetrics.undertimeMinutes || 0) +
                (calculatedMetrics.undertimeMinutes || 0)
            )
          };

          await FirebaseService.updateDailySummary(
            existingData.userId,
            existingData.date,
            updatedSummary as unknown as TimeMetrics
          );
        }
      }

      alert('Punch record updated successfully!');
      fetchAttendanceData();
      if (activeTab === 'daily') fetchDailyReports();
      if (activeTab === 'weekly') fetchWeeklyReports();
    } catch (error) {
      console.error('Error updating punch:', error);
      alert('Failed to update punch record');
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReports();
    } else if (activeTab === 'weekly') {
      fetchWeeklyReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedDate]);

  return {
    punches,
    dailyReports,
    weeklyReports,
    loading,
    fetchAttendanceData,
    fetchDailyReports,
    fetchWeeklyReports,
    handleDeletePunch,
    handleSaveEdit,
    convertTo24Hour
  };
}
