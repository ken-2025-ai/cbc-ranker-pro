import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  priority: string;
  action_url?: string;
  created_at: string;
  expires_at?: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      console.log('NotificationBell: No user logged in');
      return;
    }

    console.log('NotificationBell: Setting up for user:', user.id);
    fetchNotifications();
    
    // Set up realtime subscription for new notifications
    const subscription = supabase
      .channel('user-notifications-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('NotificationBell: New notification received:', payload);
          const newNotif = payload.new as UserNotification;
          
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast({
            title: "New Notification",
            description: newNotif.title,
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('NotificationBell: Notification updated:', payload);
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new as UserNotification : n)
          );
          if ((payload.new as UserNotification).is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('NotificationBell: Notification deleted:', payload);
          const deletedNotif = payload.old as UserNotification;
          setNotifications(prev => prev.filter(n => n.id !== deletedNotif.id));
          if (!deletedNotif.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log('NotificationBell: Subscription status:', status);
      });

    return () => {
      console.log('NotificationBell: Cleaning up subscription');
      supabase.removeChannel(subscription);
    };
  }, [user, toast]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      console.log('NotificationBell: Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('NotificationBell: Error fetching notifications:', error);
        throw error;
      }

      console.log('NotificationBell: Fetched', data?.length || 0, 'notifications');
      setNotifications(data || []);
      
      const unread = data?.filter(n => !n.is_read).length || 0;
      console.log('NotificationBell: Unread count:', unread);
      setUnreadCount(unread);
    } catch (error) {
      console.error('NotificationBell: Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'system_update':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'deadline_reminder':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={`relative p-2 hover-scale transition-smooth ${unreadCount > 0 ? 'animate-pulse' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={`h-5 w-5 transition-smooth ${unreadCount > 0 ? 'text-primary animate-bounce' : 'text-muted-foreground hover:text-primary'}`} />
        {unreadCount > 0 && (
          <>
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <Badge 
              className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-background shadow-elegant animate-bounce"
              variant="secondary"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-80 shadow-elevated z-50 bg-card border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-7"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b hover:bg-accent/50 transition-colors ${
                          !notification.is_read ? 'bg-accent/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.notification_type)}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                              if (notification.action_url) {
                                window.open(notification.action_url, '_blank');
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={(e) => deleteNotification(notification.id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationBell;