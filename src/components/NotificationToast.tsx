import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertCircle, Info } from 'lucide-react';

/**
 * NotificationToast component that listens for real-time notifications
 * and displays them as toast messages. This component should be included
 * at the app level to ensure all notifications are received.
 */
const NotificationToast = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Set up realtime subscription for new notifications
    const subscription = supabase
      .channel('user-notifications-toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Show toast for new notification
          toast({
            title: notification.title,
            description: notification.message,
            duration: notification.priority === 'high' ? 8000 : 5000,
            action: notification.action_url ? (
              <button
                onClick={() => window.open(notification.action_url, '_blank')}
                className="text-sm underline"
              >
                View
              </button>
            ) : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, toast]);

  // This component doesn't render anything visible
  return null;
};

export default NotificationToast;