import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminOverview from '@/components/admin/AdminOverview';
import InstitutionManagement from '@/components/admin/InstitutionManagement';
import SubscriptionControl from '@/components/admin/SubscriptionControl';
import YearlyPromotion from '@/components/admin/YearlyPromotion';
import NotificationCenter from '@/components/admin/NotificationCenter';
import HelpDesk from '@/components/admin/HelpDesk';
import ActivityLogs from '@/components/admin/ActivityLogs';
import ReportsAnalytics from '@/components/admin/ReportsAnalytics';
import AdminSettings from '@/components/admin/AdminSettings';
import DataCleanup from '@/components/admin/DataCleanup';
import SystemMonitoring from '@/components/admin/SystemMonitoring';
import { Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading } = useAdminAuth();
  const [currentView, setCurrentView] = useState('overview');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin auth if not authenticated
  if (!user) {
    return <Navigate to="/admin/auth" replace />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return <AdminOverview />;
      case 'institutions':
        return <InstitutionManagement />;
      case 'subscriptions':
        return <SubscriptionControl />;
      case 'promotion':
        return <YearlyPromotion />;
      case 'notifications':
        return <NotificationCenter />;
      case 'helpdesk':
        return <HelpDesk />;
      case 'logs':
        return <ActivityLogs />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'settings':
        return <AdminSettings />;
      case 'data-cleanup':
        return <DataCleanup />;
      case 'system-monitoring':
        return <SystemMonitoring />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        <div className="p-8">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;