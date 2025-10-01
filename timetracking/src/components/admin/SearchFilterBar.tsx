/**
 * SearchFilterBar Component
 * Search and filter controls for admin dashboard
 */

import { ChevronDown, Filter, Search } from 'lucide-react';
import React from 'react';

interface SearchFilterBarProps {
  searchQuery: string;
  selectedDate: string;
  showFilterMenu: boolean;
  onSearchChange: (query: string) => void;
  onDateChange: (date: string) => void;
  onFilterToggle: () => void;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  selectedDate,
  showFilterMenu,
  onSearchChange,
  onDateChange,
  onFilterToggle
}) => {
  return (
    <div className="p-6 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <button
            onClick={onFilterToggle}
            className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-white transition-colors"
          >
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Filter</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
              <div className="p-2">
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm">
                  All Status
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm">
                  Regular
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm">
                  Overtime
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm">
                  Night Diff
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm">
                  Late
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm">
                  Undertime
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
