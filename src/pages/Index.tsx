import { useState } from "react";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import StudentRegistration from "@/components/StudentRegistration";
import MarksEntry from "@/components/MarksEntry";
import StudentReports from "@/components/StudentReports";
import Rankings from "@/components/Rankings";
import Settings from "@/components/Settings";
import StaffManagement from "@/components/StaffManagement";
import SchoolAnalytics from "@/components/admin/SchoolAnalytics";
import { TeacherAnalytics } from "@/components/TeacherAnalytics";
import NotificationToast from "@/components/NotificationToast";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import FloatingNotificationIndicator from "@/components/FloatingNotificationIndicator";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const { institution, loading, userRole } = useAuth();
  const subscriptionStatus = useSubscriptionCheck();

  // Show loading spinner while checking authentication or subscription
  if (loading || subscriptionStatus.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!institution) {
    return <Navigate to="/auth" replace />;
  }

  const renderCurrentView = () => {
    // Check role-based access
    const hasAccess = (requiredRoles: string[]) => {
      return userRole && requiredRoles.includes(userRole);
    };

    switch (currentView) {
      case "dashboard":
        return <Dashboard onViewChange={setCurrentView} />;
      case "students":
      case "register":
        return hasAccess(['admin', 'principal']) ? <StudentRegistration /> : <Dashboard onViewChange={setCurrentView} />;
      case "marks":
        return <MarksEntry />;
      case "reports":
        return <StudentReports />;
      case "rankings":
        return <Rankings />;
      case "staff":
        return hasAccess(['admin', 'principal']) ? <StaffManagement /> : <Dashboard onViewChange={setCurrentView} />;
      case "analytics":
        return hasAccess(['admin', 'principal']) ? <SchoolAnalytics /> : <Dashboard onViewChange={setCurrentView} />;
      case "teacher-analytics":
        return hasAccess(['teacher']) ? <TeacherAnalytics /> : <Dashboard onViewChange={setCurrentView} />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationToast />
      <ImpersonationBanner />
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Center Top Notification Button */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <NotificationBell />
      </div>
      
      {/* Main Content Area */}
      <div className="lg:ml-64 lg:pt-16 pt-20 pb-16 lg:pb-0">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Index;
