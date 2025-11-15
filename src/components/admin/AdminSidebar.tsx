import React from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { 
  LayoutDashboard, 
  Building, 
  CreditCard, 
  Bell, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  Eye,
  X,
  GraduationCap
} from 'lucide-react';

interface AdminSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, onViewChange }) => {
  const { user, signOut, isImpersonating, impersonatedInstitution, endImpersonation } = useAdminAuth();

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'institutions', label: 'Institutions', icon: Building },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'promotion', label: 'Yearly Promotion', icon: GraduationCap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logs', label: 'Activity Logs', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-50">
      <div className="p-6">
        {/* Admin Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CBC Admin</h1>
            <p className="text-sm text-slate-400">Control Panel</p>
          </div>
        </div>

        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="mb-6 p-3 bg-orange-600/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-300">Impersonation Mode</span>
            </div>
            <p className="text-xs text-orange-200 mb-2">
              Viewing as: {impersonatedInstitution?.name}
            </p>
            <Button
              onClick={endImpersonation}
              size="sm"
              variant="outline"
              className="w-full text-orange-300 border-orange-500/50 hover:bg-orange-600/20"
            >
              <X className="w-3 h-3 mr-1" />
              Exit Impersonation
            </Button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-700">
        <div className="mb-4">
          <p className="text-sm font-medium text-white">{user?.full_name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <p className="text-xs text-blue-400 capitalize">{user?.role}</p>
        </div>
        <Button
          onClick={signOut}
          variant="outline"
          className="w-full text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;