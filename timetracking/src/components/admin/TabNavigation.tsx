/**
 * TabNavigation Component
 * Tab navigation for admin dashboard
 */

import { Calendar, Clock, FileText } from 'lucide-react';
import React from 'react';

interface TabNavigationProps {
  activeTab: 'punches' | 'daily' | 'weekly';
  onTabChange: (tab: 'punches' | 'daily' | 'weekly') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => onTabChange('punches')}
        className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
          activeTab === 'punches'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span>Punch Management</span>
      </button>
      <button
        onClick={() => onTabChange('daily')}
        className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
          activeTab === 'daily'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span>Daily Reports</span>
      </button>
      <button
        onClick={() => onTabChange('weekly')}
        className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
          activeTab === 'weekly'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span>Weekly Reports</span>
      </button>
    </div>
  );
};

export default TabNavigation;
