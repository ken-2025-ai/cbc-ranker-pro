import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Settings,
  Menu,
  X,
  GraduationCap,
  LogOut,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";


interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, institution } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "students", label: "Students", icon: Users },
    { id: "marks", label: "Marks Entry", icon: BookOpen },
    { id: "rankings", label: "Rankings", icon: TrendingUp },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "staff", label: "Staff", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-card border-r shadow-card z-40">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-primary">CBC Records</h2>
              <p className="text-xs text-muted-foreground">Academic Management</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "academic" : "ghost"}
              className="w-full justify-start transition-smooth"
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>
        
        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <div className="mb-3">
            <div className="px-2 py-1 text-sm text-muted-foreground truncate">
              {institution?.name}
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary"
            onClick={signOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-card border-b shadow-card z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-bold text-primary">CBC Records</h2>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu */}
        <div className={`fixed top-16 left-0 right-0 bg-card border-b shadow-elevated z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "academic" : "ghost"}
                className="w-full justify-start transition-smooth"
                onClick={() => handleNavClick(item.id)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            ))}
            
            {/* Mobile User Section */}
            <div className="pt-2 border-t border-primary/10 mt-2">
              <div className="px-2 py-1 text-sm text-muted-foreground truncate">
                {institution?.name}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground mt-1"
                onClick={signOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-elevated z-40">
        <div className="grid grid-cols-8 gap-1 p-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "academic" : "ghost"}
              size="sm"
              className="flex flex-col h-12 transition-smooth px-1"
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
              <span className="text-[10px] sm:text-xs leading-tight">{item.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;