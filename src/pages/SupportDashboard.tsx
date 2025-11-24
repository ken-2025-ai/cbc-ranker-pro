import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSupportAuth } from '@/contexts/SupportAuthContext';
import SupportOverview from '@/components/support/SupportOverview';
import SupportSidebar from '@/components/support/SupportSidebar';
import SupportInstitutions from '@/components/support/SupportInstitutions';
import SupportTickets from '@/components/support/SupportTickets';
import SupportTools from '@/components/support/SupportTools';
import SupportDevices from '@/components/support/SupportDevices';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { supportStaff, loading } = useSupportAuth();
  const [currentView, setCurrentView] = React.useState('overview');

  useEffect(() => {
    if (!loading && !supportStaff) {
      navigate('/support/auth');
    }
  }, [supportStaff, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supportStaff) {
    return null;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return <SupportOverview />;
      case 'institutions':
        return <SupportInstitutions />;
      case 'tickets':
        return <SupportTickets />;
      case 'monitoring':
        return <div>System Monitoring (Coming Soon)</div>;
      case 'billing':
        return <div>Billing & Subscriptions (Coming Soon)</div>;
      case 'devices':
        return <SupportDevices />;
      case 'tools':
        return <SupportTools />;
      case 'logs':
        return <div>Activity Logs (Coming Soon)</div>;
      default:
        return <SupportOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <SupportSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        supportStaff={supportStaff}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
};

export default SupportDashboard;
