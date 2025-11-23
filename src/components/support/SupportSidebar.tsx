import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Building2,
  Ticket,
  Activity,
  CreditCard,
  Smartphone,
  Wrench,
  FileText,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useSupportAuth } from '@/contexts/SupportAuthContext';
import { useToast } from '@/hooks/use-toast';

interface SupportSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  supportStaff: { full_name: string; role: string; email: string };
}

const SupportSidebar: React.FC<SupportSidebarProps> = ({
  currentView,
  onViewChange,
  supportStaff
}) => {
  const navigate = useNavigate();
  const { logout } = useSupportAuth();
  const { toast } = useToast();

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'institutions', label: 'Institutions', icon: Building2 },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket },
    { id: 'monitoring', label: 'System Monitor', icon: Activity },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'logs', label: 'Activity Logs', icon: FileText },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'level_3':
        return 'secondary';
      case 'level_2':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate('/support/auth');
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">Support Portal</h1>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium truncate">{supportStaff.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{supportStaff.email}</p>
          <Badge variant={getRoleBadgeVariant(supportStaff.role)} className="text-xs">
            {supportStaff.role.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default SupportSidebar;
