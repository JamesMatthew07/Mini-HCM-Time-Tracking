/**
 * PunchTable Component
 * Displays a table of punch records with actions
 */

import { Edit, Eye, Trash2, Users } from 'lucide-react';
import React from 'react';
import { type Punch } from '../../types';
import { getStatusColor, getStatusLabel } from '../../utils/status.utils';

interface PunchTableProps {
  punches: Punch[];
  onView: (punch: Punch) => void;
  onEdit: (punch: Punch) => void;
  onDelete: (punchId: string) => void;
}

const PunchTable: React.FC<PunchTableProps> = ({
  punches,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Employee Punches</h2>
        <span className="text-sm text-gray-600">{punches.length} total punches</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Employee</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Punch In</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Punch Out</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Total Hours</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {punches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No punch records found for this date
                </td>
              </tr>
            ) : (
              punches.map((punch) => (
                <tr key={punch.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{punch.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{punch.date}</td>
                  <td className="px-4 py-4 text-gray-700">{punch.punchIn}</td>
                  <td className="px-4 py-4 text-gray-700">{punch.punchOut}</td>
                  <td className="px-4 py-4 font-semibold text-gray-900">{punch.totalHours} hrs</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        punch.status
                      )}`}
                    >
                      {getStatusLabel(punch.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(punch)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(punch)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit punch"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(punch.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete punch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PunchTable;
