/**
 * WeeklyReportTable Component
 * Displays weekly attendance report table
 */

import { TrendingUp, Users } from 'lucide-react';
import React from 'react';
import { type WeeklyReport } from '../../types';

interface WeeklyReportTableProps {
  reports: WeeklyReport[];
  selectedDate: string;
}

const WeeklyReportTable: React.FC<WeeklyReportTableProps> = ({ reports, selectedDate }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Weekly Report</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>Week of {selectedDate}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Employee</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Regular (hrs)</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">OT (hrs)</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">ND (hrs)</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Late (min)</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Undertime (min)</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Total (hrs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No weekly reports found for this week
                </td>
              </tr>
            ) : (
              reports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{report.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-700">{report.regularHours}</td>
                  <td className="px-4 py-4 text-right text-blue-600 font-medium">{report.overtimeHours}</td>
                  <td className="px-4 py-4 text-right text-purple-600 font-medium">{report.nightDiffHours}</td>
                  <td className="px-4 py-4 text-right text-orange-600 font-medium">{report.lateMinutes}</td>
                  <td className="px-4 py-4 text-right text-red-600 font-medium">{report.undertimeMinutes}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">{report.totalHours}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyReportTable;
