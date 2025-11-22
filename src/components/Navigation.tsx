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
  BarChart3,
  FileStack
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";


interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, institution, userRole } = useAuth();

  // Define all navigation items with role restrictions
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'principal', 'teacher', 'staff'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['admin', 'principal'] },
    { id: 'marks', label: 'Marks Entry', icon: BookOpen, roles: ['admin', 'principal', 'teacher', 'staff'] },
    { id: 'exams-kenya', label: 'Exams Kenya', icon: FileStack, roles: ['admin', 'principal', 'teacher', 'staff'] },
    { id: 'rankings', label: 'Rankings', icon: TrendingUp, roles: ['admin', 'principal', 'teacher', 'staff'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin', 'principal', 'teacher', 'staff'] },
    { id: 'staff', label: 'Staff', icon: Users, roles: ['admin', 'principal'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'principal'] },
    { id: 'teacher-analytics', label: 'My Analytics', icon: BarChart3, roles: ['teacher'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'principal', 'teacher', 'staff'] },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

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
          {/* Hamburger Menu Button - Left Side (Most Accessible) */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative z-10 h-12 w-12 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:border-primary/50 hover:from-primary/25 hover:to-primary/10 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-primary transition-transform duration-300 rotate-90" />
            ) : (
              <Menu className="h-6 w-6 text-primary transition-transform duration-300" />
            )}
          </Button>
          
          {/* Logo/Branding - Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-bold text-primary text-sm sm:text-base">CBC Records</h2>
          </div>
          
          {/* Spacer for balance */}
          <div className="w-12"></div>
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
            
            {/* Sign Out Button */}
            <div className="pt-2 mt-2 border-t border-primary/10">
              <Button
                variant="ghost"
                className="w-full justify-start transition-smooth text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </Button>
            </div>
            
            {/* Institution Name Footer */}
            <div className="pt-3 pb-2">
              <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
                <p className="text-xs text-muted-foreground font-medium mb-1">Institution</p>
                <p className="text-sm font-semibold text-primary truncate">{institution?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default Navigation;