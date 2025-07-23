import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import StudentRegistration from "@/components/StudentRegistration";
import MarksEntry from "@/components/MarksEntry";

const Index = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "students":
        return <StudentRegistration />;
      case "marks":
        return <MarksEntry />;
      case "rankings":
        return (
          <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Rankings & Analytics</h2>
              <p className="text-muted-foreground">Coming soon - View class and stream rankings</p>
            </div>
          </div>
        );
      case "reports":
        return (
          <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Report Generation</h2>
              <p className="text-muted-foreground">Coming soon - Generate student report cards</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Settings</h2>
              <p className="text-muted-foreground">Coming soon - Institution and system settings</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Main Content Area */}
      <div className="lg:ml-64 lg:pt-0 pt-16 pb-16 lg:pb-0">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Index;
