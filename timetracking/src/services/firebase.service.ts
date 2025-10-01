/**
 * Firebase Service Layer
 * Handles all Firebase operations with proper error handling
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import type { AttendanceRecord, DailySummary, TimeMetrics, User } from '../types';

export class FirebaseService {
  /**
   * Get user data from Firestore
   */
  static async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  /**
   * Get user name from userId
   */
  static async getUserName(userId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data.name || data.email || 'Unknown User';
      }
      return userId;
    } catch (error) {
      console.error('Error fetching user name:', error);
      return userId;
    }
  }

  /**
   * Save user to Firestore
   */
  static async saveUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving user:', error);
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Create punch in record
   */
  static async createPunchIn(userId: string, userEmail: string, userName: string, date: string): Promise<string> {
    try {
      const attendanceData: Partial<AttendanceRecord> = {
        userId,
        userEmail,
        userName,
        punchIn: serverTimestamp(),
        punchOut: undefined,
        type: 'punch_in',
        timestamp: serverTimestamp(),
        date
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating punch in:', error);
      throw new Error('Failed to save punch in');
    }
  }

  /**
   * Update punch out record
   */
  static async updatePunchOut(
    attendanceId: string,
    duration: number,
    metrics?: TimeMetrics
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        punchOut: serverTimestamp(),
        duration,
        type: 'completed'
      };

      if (metrics) {
        updateData.metrics = metrics;
        updateData.regularHours = parseFloat(metrics.regularHours);
        updateData.overtimeHours = parseFloat(metrics.overtimeHours);
        updateData.nightDiffHours = parseFloat(metrics.nightDiffHours);
        updateData.lateMinutes = metrics.lateMinutes;
        updateData.undertimeMinutes = metrics.undertimeMinutes;
      }

      await updateDoc(doc(db, 'attendance', attendanceId), updateData);
    } catch (error) {
      console.error('Error updating punch out:', error);
      throw new Error('Failed to save punch out');
    }
  }

  /**
   * Create punch out record (separate document)
   */
  static async createPunchOutRecord(
    userId: string,
    userEmail: string,
    userName: string,
    date: string,
    sessionId: string,
    duration: number,
    metrics?: TimeMetrics
  ): Promise<void> {
    try {
      const punchOutData: Partial<AttendanceRecord> = {
        userId,
        userEmail,
        userName,
        punchOut: serverTimestamp(),
        type: 'punch_out',
        timestamp: serverTimestamp(),
        date,
        relatedSessionId: sessionId,
        duration
      };

      if (metrics) {
        punchOutData.metrics = metrics;
      }

      await addDoc(collection(db, 'attendance'), punchOutData);
    } catch (error) {
      console.error('Error creating punch out record:', error);
      throw new Error('Failed to create punch out record');
    }
  }

  /**
   * Get attendance records for a specific date
   */
  static async getAttendanceByDate(date: string): Promise<DocumentData[]> {
    try {
      const attendanceRef = collection(db, 'attendance');
      const q = query(
        attendanceRef,
        where('date', '==', date),
        where('type', '==', 'completed')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw new Error('Failed to fetch attendance records');
    }
  }

  /**
   * Get or create daily summary
   */
  static async getDailySummary(userId: string, date: string): Promise<DailySummary | null> {
    try {
      const summaryId = `${userId}_${date}`;
      const summaryDoc = await getDoc(doc(db, 'dailySummary', summaryId));

      if (summaryDoc.exists()) {
        return summaryDoc.data() as DailySummary;
      }
      return null;
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      throw new Error('Failed to fetch daily summary');
    }
  }

  /**
   * Update or create daily summary
   */
  static async updateDailySummary(
    userId: string,
    date: string,
    metrics: TimeMetrics
  ): Promise<void> {
    try {
      const summaryId = `${userId}_${date}`;
      const summaryRef = doc(db, 'dailySummary', summaryId);
      const summarySnap = await getDoc(summaryRef);

      if (summarySnap.exists()) {
        // Update existing summary
        const existing = summarySnap.data();
        const updatedData = {
          totalWorkedHours: (
            parseFloat(existing.totalWorkedHours || '0') + parseFloat(metrics.totalWorkedHours)
          ).toFixed(2),
          regularHours: (
            parseFloat(existing.regularHours || '0') + parseFloat(metrics.regularHours)
          ).toFixed(2),
          overtimeHours: (
            parseFloat(existing.overtimeHours || '0') + parseFloat(metrics.overtimeHours)
          ).toFixed(2),
          nightDiffHours: (
            parseFloat(existing.nightDiffHours || '0') + parseFloat(metrics.nightDiffHours)
          ).toFixed(2),
          totalLateMinutes: (existing.totalLateMinutes || 0) + metrics.lateMinutes,
          totalUndertimeMinutes: (existing.totalUndertimeMinutes || 0) + metrics.undertimeMinutes,
          lastUpdated: serverTimestamp()
        };

        await updateDoc(summaryRef, updatedData);
      } else {
        // Create new summary
        const newSummary: DailySummary = {
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

        await setDoc(summaryRef, newSummary);
      }
    } catch (error) {
      console.error('Error updating daily summary:', error);
      throw new Error('Failed to update daily summary');
    }
  }

  /**
   * Get daily summaries for a specific date
   */
  static async getDailySummariesByDate(date: string): Promise<DocumentData[]> {
    try {
      const summariesRef = collection(db, 'dailySummary');
      const q = query(summariesRef, where('date', '==', date));
      const querySnapshot = await getDocs(q);

      console.log('Firebase getDailySummariesByDate - Query:', { date });
      console.log('Firebase getDailySummariesByDate - Docs count:', querySnapshot.docs.length);
      console.log('Firebase getDailySummariesByDate - All docs:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching daily summaries:', error);
      throw new Error('Failed to fetch daily summaries');
    }
  }

  /**
   * Get daily summaries for a date range
   */
  static async getDailySummariesByDateRange(startDate: string, endDate: string): Promise<DocumentData[]> {
    try {
      const summariesRef = collection(db, 'dailySummary');
      const q = query(
        summariesRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching daily summaries by range:', error);
      throw new Error('Failed to fetch daily summaries');
    }
  }

  /**
   * Delete attendance record
   */
  static async deleteAttendance(attendanceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'attendance', attendanceId));
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw new Error('Failed to delete attendance record');
    }
  }

  /**
   * Delete daily summary
   */
  static async deleteDailySummary(userId: string, date: string): Promise<void> {
    try {
      const summaryId = `${userId}_${date}`;
      await deleteDoc(doc(db, 'dailySummary', summaryId));
    } catch (error) {
      console.error('Error deleting daily summary:', error);
      throw new Error('Failed to delete daily summary');
    }
  }

  /**
   * Get attendance record by ID
   */
  static async getAttendanceById(attendanceId: string): Promise<DocumentData | null> {
    try {
      const attendanceDoc = await getDoc(doc(db, 'attendance', attendanceId));
      if (attendanceDoc.exists()) {
        return { id: attendanceDoc.id, ...attendanceDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching attendance by ID:', error);
      throw new Error('Failed to fetch attendance record');
    }
  }

  /**
   * Update attendance record
   */
  static async updateAttendance(
    attendanceId: string,
    punchIn: Date,
    punchOut: Date,
    date: string,
    metrics: TimeMetrics
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'attendance', attendanceId), {
        punchIn: Timestamp.fromDate(punchIn),
        punchOut: Timestamp.fromDate(punchOut),
        date,
        metrics
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw new Error('Failed to update attendance record');
    }
  }
}
