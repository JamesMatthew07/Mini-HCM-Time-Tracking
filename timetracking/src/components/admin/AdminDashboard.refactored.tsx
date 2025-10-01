/**
 * AdminDashboard Component (Refactored)
 * Main admin dashboard using smaller, focused components
 */

import { Download, LogOut, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import type { Punch, User } from '../../types';
import { getTodayISO } from '../../utils/date.utils';
import DailyReportTable from './DailyReportTable';
import EditPunchModal from './EditPunchModal';
import PunchTable from './PunchTable';
import SearchFilterBar from './SearchFilterBar';
import TabNavigation from './TabNavigation';
import WeeklyReportTable from './WeeklyReportTable';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'punches' | 'daily' | 'weekly'>('punches');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [editingPunch, setEditingPunch] = useState<Punch | null>(null);
  const [editFormData, setEditFormData] = useState({
    punchIn: '',
    punchOut: '',
    date: ''
  });

  const {
    punches,
    dailyReports,
    weeklyReports,
    loading,
    // fetchAttendanceData,
    fetchDailyReports,
    fetchWeeklyReports,
    handleDeletePunch,
    handleSaveEdit,
    convertTo24Hour
  } = useAdminDashboard(selectedDate, activeTab);

  // Filter punches based on search query
  const filteredPunches = punches.filter((punch) =>
    punch.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter reports based on search query
  const filteredDailyReports = dailyReports.filter((report) =>
    report.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWeeklyReports = weeklyReports.filter((report) =>
    report.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewPunch = (punch: Punch) => {
    alert(
      `Punch Details:\nEmployee: ${punch.employeeName}\nDate: ${punch.date}\nPunch In: ${punch.punchIn}\nPunch Out: ${punch.punchOut}\nTotal Hours: ${punch.totalHours}\nStatus: ${punch.status}`
    );
  };

  const handleEditPunch = (punch: Punch) => {
    setEditingPunch(punch);
    const today = punch.date;
    setEditFormData({
      punchIn: `${today}T${convertTo24Hour(punch.punchIn)}`,
      punchOut: `${today}T${convertTo24Hour(punch.punchOut)}`,
      date: punch.date
    });
  };

  const handleSaveEditForm = () => {
    if (!editingPunch) return;
    handleSaveEdit(editingPunch.id, editFormData.punchIn, editFormData.punchOut, editFormData.date);
    setEditingPunch(null);
  };

  const handleCancelEdit = () => {
    setEditingPunch(null);
    setEditFormData({ punchIn: '', punchOut: '', date: '' });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>
                <p className="text-gray-600">Manage employee punches and view reports</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
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

        {/* Tab Navigation and Content */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 border border-gray-100">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Search and Filter Bar */}
          <SearchFilterBar
            searchQuery={searchQuery}
            selectedDate={selectedDate}
            showFilterMenu={showFilterMenu}
            activeTab={activeTab}
            onSearchChange={setSearchQuery}
            onDateChange={setSelectedDate}
            onFilterToggle={() => setShowFilterMenu(!showFilterMenu)}
          />

          {/* Content Area */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : (
              <>
                {activeTab === 'punches' && (
                  <PunchTable
                    punches={filteredPunches}
                    onView={handleViewPunch}
                    onEdit={handleEditPunch}
                    onDelete={handleDeletePunch}
                  />
                )}

                {activeTab === 'daily' && (
                  <DailyReportTable reports={filteredDailyReports} selectedDate={selectedDate} />
                )}

                {activeTab === 'weekly' && (
                  <WeeklyReportTable reports={filteredWeeklyReports} selectedDate={selectedDate} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Punch Modal */}
      {editingPunch && (
        <EditPunchModal
          punch={editingPunch}
          formData={editFormData}
          onFormChange={(field, value) => setEditFormData({ ...editFormData, [field]: value })}
          onSave={handleSaveEditForm}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
