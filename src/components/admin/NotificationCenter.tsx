import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Bell, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Plus,
  MessageSquare
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_type: string;
  target_institutions: string[];
  is_sent: boolean;
  sent_at: string | null;
  delivery_method: string[];
  created_at: string;
}

interface Institution {
  id: string;
  name: string;
  subscription_status: string;
}

const NotificationCenter = () => {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    notificationType: 'general',
    targetType: 'all',
    deliveryMethod: ['in_app', 'email'],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch notifications
      const { data: notifData, error: notifError } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      // Fetch institutions for targeting
      const { data: instData, error: instError } = await supabase
        .from('admin_institutions')
        .select('id, name, subscription_status')
        .order('name');

      if (instError) throw instError;

      setNotifications(notifData || []);
      setInstitutions(instData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let targetInstitutionIds: string[] = [];
      
      if (notificationForm.targetType === 'specific') {
        targetInstitutionIds = selectedInstitutions;
      } else if (notificationForm.targetType === 'active_only') {
        targetInstitutionIds = institutions
          .filter(inst => inst.subscription_status === 'paid')
          .map(inst => inst.id);
      } else if (notificationForm.targetType === 'expired_only') {
        targetInstitutionIds = institutions
          .filter(inst => inst.subscription_status === 'expired' || inst.subscription_status === 'unpaid')
          .map(inst => inst.id);
      }

      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          title: notificationForm.title,
          message: notificationForm.message,
          notification_type: notificationForm.notificationType,
          target_type: notificationForm.targetType,
          target_institutions: targetInstitutionIds,
          sent_by: user.id,
          delivery_method: notificationForm.deliveryMethod,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification created successfully",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
    }
  };

  const sendNotification = async (notificationId: string) => {
    try {
      // Call the send-notification edge function
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          notificationId,
          sessionToken: user?.id // Use admin user ID as session token
        }
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message || 'Failed to invoke send-notification function');
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: `Notification sent successfully! ${data.stats?.emailsSent || 0} emails sent, ${data.stats?.inAppNotificationsCreated || 0} in-app notifications created for ${data.stats?.totalInstitutions || 0} institutions`,
      });

      fetchData();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNotificationForm({
      title: '',
      message: '',
      notificationType: 'general',
      targetType: 'all',
      deliveryMethod: ['in_app', 'email'],
    });
    setSelectedInstitutions([]);
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return 'bg-yellow-600';
      case 'system_update':
        return 'bg-blue-600';
      case 'deadline_reminder':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTargetDescription = (notification: Notification) => {
    switch (notification.target_type) {
      case 'all':
        return 'All institutions';
      case 'active_only':
        return 'Active institutions only';
      case 'expired_only':
        return 'Expired/Unpaid institutions';
      case 'specific':
        return `${notification.target_institutions.length} specific institution(s)`;
      default:
        return 'Unknown target';
    }
  };

  const stats = {
    totalNotifications: notifications.length,
    sentNotifications: notifications.filter(n => n.is_sent).length,
    pendingNotifications: notifications.filter(n => !n.is_sent).length,
    recentNotifications: notifications.filter(n => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(n.created_at) > weekAgo;
    }).length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notification Center</h1>
          <p className="text-slate-400">Create and manage notifications for institutions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Notification</DialogTitle>
              <DialogDescription className="text-slate-400">
                Send notifications to institutions via in-app messages
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">Notification Title</Label>
                <Input
                  id="title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter notification title..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-300">Message</Label>
                <Textarea
                  id="message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter your message..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notificationType" className="text-slate-300">Notification Type</Label>
                  <Select value={notificationForm.notificationType} onValueChange={(value) => setNotificationForm({...notificationForm, notificationType: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                      <SelectItem value="system_update">System Update</SelectItem>
                      <SelectItem value="deadline_reminder">Deadline Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetType" className="text-slate-300">Target Audience</Label>
                  <Select value={notificationForm.targetType} onValueChange={(value) => setNotificationForm({...notificationForm, targetType: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">All Institutions</SelectItem>
                      <SelectItem value="active_only">Active Institutions Only</SelectItem>
                      <SelectItem value="expired_only">Expired/Unpaid Only</SelectItem>
                      <SelectItem value="specific">Specific Institutions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {notificationForm.targetType === 'specific' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Select Institutions</Label>
                  <div className="max-h-40 overflow-y-auto bg-slate-700/50 border border-slate-600 rounded-lg p-3 space-y-2">
                    {institutions.map((institution) => (
                      <div key={institution.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={institution.id}
                          checked={selectedInstitutions.includes(institution.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedInstitutions([...selectedInstitutions, institution.id]);
                            } else {
                              setSelectedInstitutions(selectedInstitutions.filter(id => id !== institution.id));
                            }
                          }}
                        />
                        <label htmlFor={institution.id} className="text-sm text-slate-300 cursor-pointer">
                          {institution.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Delivery Methods</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="in_app"
                      checked={notificationForm.deliveryMethod.includes('in_app')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationForm({
                            ...notificationForm,
                            deliveryMethod: [...notificationForm.deliveryMethod.filter(m => m !== 'in_app'), 'in_app']
                          });
                        } else {
                          setNotificationForm({
                            ...notificationForm,
                            deliveryMethod: notificationForm.deliveryMethod.filter(m => m !== 'in_app')
                          });
                        }
                      }}
                    />
                    <label htmlFor="in_app" className="text-sm text-slate-300 cursor-pointer">
                      In-App Notification
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={notificationForm.deliveryMethod.includes('email')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationForm({
                            ...notificationForm,
                            deliveryMethod: [...notificationForm.deliveryMethod.filter(m => m !== 'email'), 'email']
                          });
                        } else {
                          setNotificationForm({
                            ...notificationForm,
                            deliveryMethod: notificationForm.deliveryMethod.filter(m => m !== 'email')
                          });
                        }
                      }}
                    />
                    <label htmlFor="email" className="text-sm text-slate-300 cursor-pointer">
                      Email
                    </label>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Select at least one delivery method</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Notification
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalNotifications}</div>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.sentNotifications}</div>
            <p className="text-xs text-slate-400 mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingNotifications}</div>
            <p className="text-xs text-slate-400 mt-1">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">This Week</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.recentNotifications}</div>
            <p className="text-xs text-slate-400 mt-1">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Notification History</CardTitle>
          <CardDescription className="text-slate-400">
            View and manage all created notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No notifications created yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-white">{notification.title}</h3>
                      <Badge className={getNotificationTypeColor(notification.notification_type)}>
                        {notification.notification_type.replace('_', ' ')}
                      </Badge>
                      {notification.is_sent ? (
                        <Badge variant="default" className="bg-green-600">Sent</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{getTargetDescription(notification)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {notification.is_sent && notification.sent_at
                            ? `Sent ${new Date(notification.sent_at).toLocaleDateString()}`
                            : `Created ${new Date(notification.created_at).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.is_sent && (
                      <Button
                        size="sm"
                        onClick={() => sendNotification(notification.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;