import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Calendar, Clock, LogIn, LogOut, Timer, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { getTodayISO } from '../utils/date.utils';

interface User {
  name: string;
  email: string;
  userId?: string;
  schedule?: {
    start: string;
    end: string;
    timezone?: string;
  };
}

interface PunchClockProps {
  user: User;
  onLogout: () => void;
}

interface TimeEntry {
  id: string;
  punchIn: Date;
  punchOut?: Date;
  duration?: number;
  metrics?: {
    regularHours: string;
    overtimeHours: string;
    nightDiffHours: string;
    lateMinutes: number;
    undertimeMinutes: number;
  };
}

/**
 * Update or create daily summary in Firestore
 */
async function updateDailySummary(userId: string, date: string, metrics: any) {
  try {
    console.log('=== Updating Daily Summary ===');
    console.log('User ID:', userId);
    console.log('Date:', date);
    console.log('Metrics:', metrics);

    const summaryId = `${userId}_${date}`;
    const summaryRef = doc(db, 'dailySummary', summaryId);

    console.log('Summary ID:', summaryId);

    // Get existing summary if it exists
    const summarySnap = await getDoc(summaryRef);

    if (summarySnap.exists()) {
      // Update existing summary by adding new metrics
      const existing = summarySnap.data();
      console.log('Existing summary found:', existing);

      const updatedData = {
        totalWorkedHours: (parseFloat(existing.totalWorkedHours || '0') + parseFloat(metrics.totalWorkedHours)).toFixed(2),
        regularHours: (parseFloat(existing.regularHours || '0') + parseFloat(metrics.regularHours)).toFixed(2),
        overtimeHours: (parseFloat(existing.overtimeHours || '0') + parseFloat(metrics.overtimeHours)).toFixed(2),
        nightDiffHours: (parseFloat(existing.nightDiffHours || '0') + parseFloat(metrics.nightDiffHours)).toFixed(2),
        totalLateMinutes: (existing.totalLateMinutes || 0) + metrics.lateMinutes,
        totalUndertimeMinutes: (existing.totalUndertimeMinutes || 0) + metrics.undertimeMinutes,
        lastUpdated: serverTimestamp()
      };

      console.log('Updating with:', updatedData);
      await updateDoc(summaryRef, updatedData);
      console.log('✓ Daily summary updated successfully');
    } else {
      // Create new summary
      console.log('No existing summary, creating new one');

      const newSummary = {
        userId,
        date,
        totalWorkedHours: metrics.totalWorkedHours,
        regularHours: metrics.regularHours,
        overtimeHours: metrics.overtimeHours,
        nightDiffHours: metrics.nightDiffHours,
        totalLateMinutes: metrics.lateMinutes,
        totalUndertimeMinutes: metrics.undertimeMinutes,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };

      console.log('Creating new summary:', newSummary);
      await setDoc(summaryRef, newSummary);
      console.log('✓ Daily summary created successfully');
    }

    console.log('Daily summary operation completed for', date);
  } catch (error) {
    console.error('❌ Error updating daily summary:', error);
    alert(`Failed to update daily summary: ${error}`);
  }
}

const PunchClock: React.FC<PunchClockProps> = ({ user, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  // const [showDashboard, setShowDashboard] = useState(false);
  // const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update elapsed time when punched in
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPunchedIn && currentSession) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentSession.punchIn.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPunchedIn, currentSession]);

  const handlePunchIn = async () => {
    try {
      const punchInTime = new Date();
      const todayDate = getTodayISO(); // Use utility for consistent date
      console.log('Punch In - Date:', todayDate); // Debug log
      const attendanceData = {
        userId: user.userId || user.email,
        userEmail: user.email,
        userName: user.name,
        punchIn: serverTimestamp(),
        punchOut: null,
        type: 'punch_in',
        timestamp: serverTimestamp(),
        date: todayDate // YYYY-MM-DD format
      };

      // Save to Firestore attendance collection
      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);

      const newSession: TimeEntry = {
        id: docRef.id, // Use Firestore document ID
        punchIn: punchInTime,
      };

      setCurrentSession(newSession);
      setIsPunchedIn(true);
      setElapsedTime(0);

      console.log('Punch in saved to Firestore with ID:', docRef.id);
    } catch (error) {
      console.error('Error saving punch in to Firestore:', error);
      alert('Failed to save punch in. Please try again.');
    }
  };

  const handlePunchOut = async () => {
    if (currentSession) {
      try {
        const punchOutTime = new Date();
        const duration = Math.floor((punchOutTime.getTime() - currentSession.punchIn.getTime()) / 1000);

        // Default schedule if user doesn't have one
        const schedule = user.schedule || {
          start: '09:00',
          end: '18:00',
          timezone: 'Asia/Manila' // Philippine Time
        };

        // Calculate time metrics using the backend API
        let calculatedMetrics = null;
        try {
          const response = await fetch('http://localhost:5000/api/calculate-time', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              punchIn: currentSession.punchIn.toISOString(),
              punchOut: punchOutTime.toISOString(),
              schedule: schedule
            })
          });

          if (response.ok) {
            const result = await response.json();
            calculatedMetrics = result.data;
            console.log('Calculated time metrics:', calculatedMetrics);
          } else {
            console.error('Failed to calculate time metrics:', await response.text());
          }
        } catch (apiError) {
          console.error('Error calling time calculation API:', apiError);
          // Continue without metrics if API fails
        }

        // Update the existing Firestore document with punch out data and metrics
        const attendanceRef = doc(db, 'attendance', currentSession.id);
        const updateData: any = {
          punchOut: serverTimestamp(),
          duration: duration,
          type: 'completed'
        };

        // Add calculated metrics if available
        if (calculatedMetrics) {
          updateData.metrics = {
            totalWorkedHours: calculatedMetrics.totalWorkedHours,
            totalWorkedMinutes: calculatedMetrics.totalWorkedMinutes,
            regularHours: calculatedMetrics.regularHours,
            regularMinutes: calculatedMetrics.regularMinutes,
            overtimeHours: calculatedMetrics.overtimeHours,
            overtimeMinutes: calculatedMetrics.overtimeMinutes,
            nightDiffHours: calculatedMetrics.nightDiffHours,
            nightDiffMinutes: calculatedMetrics.nightDiffMinutes,
            lateMinutes: calculatedMetrics.lateMinutes,
            undertimeMinutes: calculatedMetrics.undertimeMinutes
          };
          updateData.regularHours = parseFloat(calculatedMetrics.regularHours);
          updateData.overtimeHours = parseFloat(calculatedMetrics.overtimeHours);
          updateData.nightDiffHours = parseFloat(calculatedMetrics.nightDiffHours);
          updateData.lateMinutes = calculatedMetrics.lateMinutes;
          updateData.undertimeMinutes = calculatedMetrics.undertimeMinutes;
        }

        await updateDoc(attendanceRef, updateData);

        // Also create a separate punch_out record for tracking individual punches
        const todayDate = getTodayISO(); // Use utility for consistent date
        console.log('Punch Out - Date:', todayDate); // Debug log
        const punchOutData: any = {
          userId: user.userId || user.email,
          userEmail: user.email,
          userName: user.name,
          punchOut: serverTimestamp(),
          type: 'punch_out',
          timestamp: serverTimestamp(),
          date: todayDate,
          relatedSessionId: currentSession.id,
          duration: duration
        };

        if (calculatedMetrics) {
          punchOutData.metrics = updateData.metrics;
        }

        await addDoc(collection(db, 'attendance'), punchOutData);

        // Update daily summary if metrics were calculated
        if (calculatedMetrics) {
          await updateDailySummary(
            user.userId || user.email,
            todayDate, // Use same date variable
            calculatedMetrics
          );
        }

        const completedEntry: TimeEntry = {
          ...currentSession,
          punchOut: punchOutTime,
          duration: duration,
          metrics: calculatedMetrics ? {
            regularHours: calculatedMetrics.regularHours,
            overtimeHours: calculatedMetrics.overtimeHours,
            nightDiffHours: calculatedMetrics.nightDiffHours,
            lateMinutes: calculatedMetrics.lateMinutes,
            undertimeMinutes: calculatedMetrics.undertimeMinutes
          } : undefined
        };

        setTimeEntries([completedEntry, ...timeEntries]);
        setCurrentSession(null);
        setIsPunchedIn(false);
        setElapsedTime(0);
        // setDashboardRefreshKey(prev => prev + 1); // Trigger Dashboard refresh

        console.log('Punch out saved to Firestore with calculated metrics and daily summary updated');
      } catch (error) {
        console.error('Error saving punch out to Firestore:', error);
        alert('Failed to save punch out. Please try again.');
      }
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalHoursToday = (): string => {
    const today = new Date().toDateString();
    const todayEntries = timeEntries.filter(
      entry => entry.punchIn.toDateString() === today
    );
    
    const totalSeconds = todayEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
    return formatDuration(totalSeconds + (isPunchedIn ? elapsedTime : 0));
  };

  // If showing dashboard, render it instead
  // if (showDashboard) {
  //   return (
  //     <div>
  //       <div className="bg-white p-4 shadow-md">
  //         <button
  //           onClick={() => setShowDashboard(false)}
  //           className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
  //         >
  //           ← Back to Punch Clock
  //         </button>
  //       </div>
  //       <Dashboard key={dashboardRefreshKey} user={user} />
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h1>
                <p className="text-gray-600">Manage your work hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <p className="text-sm">{formatDate(currentTime)}</p>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <p className="text-2xl font-bold text-gray-900">{formatTime(currentTime)}</p>
                </div>
              </div>
              {/* <button
                onClick={() => setShowDashboard(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>History</span>
              </button> */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
              isPunchedIn 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isPunchedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="font-medium">
                {isPunchedIn ? 'Currently Clocked In' : 'Not Clocked In'}
              </span>
            </div>
          </div>

          {/* Current Session Timer */}
          {isPunchedIn && currentSession && (
            <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Timer className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Current Session</h3>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Punched in at {formatTime(currentSession.punchIn)}
                </p>
                <p className="text-5xl font-bold text-indigo-600 mb-2">
                  {formatDuration(elapsedTime)}
                </p>
                <p className="text-sm text-gray-500">Elapsed Time</p>
              </div>
            </div>
          )}

          {/* Punch Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePunchIn}
              disabled={isPunchedIn}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
                isPunchedIn
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
              }`}
            >
              <LogIn className="w-6 h-6" />
              <span>Punch In</span>
            </button>

            <button
              onClick={handlePunchOut}
              disabled={!isPunchedIn}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
                !isPunchedIn
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg'
              }`}
            >
              <LogOut className="w-6 h-6" />
              <span>Punch Out</span>
            </button>
          </div>

          {/* Today's Total */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total Hours Today:</span>
              <span className="text-2xl font-bold text-indigo-600">{getTotalHoursToday()}</span>
            </div>
          </div>
        </div>

        {/* Time Entries History */}
        {timeEntries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {timeEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {entry.punchIn.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(entry.punchIn)} - {entry.punchOut ? formatTime(entry.punchOut) : 'In Progress'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {entry.duration ? formatDuration(entry.duration) : '--:--:--'}
                      </p>
                      <p className="text-xs text-gray-500">Total Duration</p>
                    </div>
                  </div>

                  {/* Time Metrics */}
                  {entry.metrics && (
                    <div className="grid grid-cols-5 gap-2 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-green-600">{entry.metrics.regularHours}h</p>
                        <p className="text-xs text-gray-500">Regular</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-blue-600">{entry.metrics.overtimeHours}h</p>
                        <p className="text-xs text-gray-500">OT</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-purple-600">{entry.metrics.nightDiffHours}h</p>
                        <p className="text-xs text-gray-500">Night Diff</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-red-600">{entry.metrics.lateMinutes}m</p>
                        <p className="text-xs text-gray-500">Late</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-orange-600">{entry.metrics.undertimeMinutes}m</p>
                        <p className="text-xs text-gray-500">Undertime</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PunchClock;