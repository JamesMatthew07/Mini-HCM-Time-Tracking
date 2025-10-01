/**
 * EditPunchModal Component
 * Modal for editing punch records
 */

import React from 'react';
import type { Punch } from '../../types';

interface EditPunchModalProps {
  punch: Punch;
  formData: {
    punchIn: string;
    punchOut: string;
    date: string;
  };
  onFormChange: (field: 'punchIn' | 'punchOut' | 'date', value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditPunchModal: React.FC<EditPunchModalProps> = ({
  punch,
  formData,
  onFormChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Punch Record</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
            <input
              type="text"
              value={punch.employeeName}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange('date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Punch In</label>
            <input
              type="datetime-local"
              value={formData.punchIn}
              onChange={(e) => onFormChange('punchIn', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Punch Out</label>
            <input
              type="datetime-local"
              value={formData.punchOut}
              onChange={(e) => onFormChange('punchOut', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPunchModal;
