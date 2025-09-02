import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FloatingNotificationIndicatorProps {
  onOpenNotifications: () => void;
}

const FloatingNotificationIndicator = ({ onOpenNotifications }: FloatingNotificationIndicatorProps) => {
  const { institution, institutionId } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [lastNotification, setLastNotification] = useState<string>('');

  useEffect(() => {
    if (!institution) return;

    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('user_notifications')
          .select('id')
          .eq('user_id', institutionId)
          .eq('is_read', false)
          .or('expires_at.is.null,expires_at.gt.now()');

        if (error) throw error;
        
        const count = data?.length || 0;
        setUnreadCount(count);
        setIsVisible(count > 0);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      }
    };

    fetchUnreadCount();

    // Set up realtime subscription
    const subscription = supabase
      .channel('floating-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${institutionId}`
        },
        (payload) => {
          const notification = payload.new as any;
          setUnreadCount(prev => prev + 1);
          setLastNotification(notification.title);
          setIsVisible(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${institutionId}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [institution, institutionId]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleClick = () => {
    onOpenNotifications();
    setIsVisible(false);
  };

  if (!institution || !isVisible || unreadCount === 0) return null;

  return (
    <div className="fixed top-20 right-4 lg:top-4 lg:right-4 z-50 animate-slide-in-right">
      <div 
        className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-lg shadow-elegant p-4 min-w-[280px] max-w-[320px] cursor-pointer hover-scale transition-smooth"
        onClick={handleClick}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-white/20">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <Badge className="bg-white/20 text-primary-foreground border-white/30">
              {unreadCount} new
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="text-sm font-medium mb-1">
          {lastNotification || 'New notifications available'}
        </div>
        <div className="text-xs text-primary-foreground/80">
          Click to view all notifications
        </div>
      </div>
    </div>
  );
};

export default FloatingNotificationIndicator;