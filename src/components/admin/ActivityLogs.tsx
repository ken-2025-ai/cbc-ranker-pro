import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  User, 
  Calendar, 
  Monitor,
  MapPin,
  Activity
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_users: {
    email: string;
    full_name: string;
  } | null;
}

const ActivityLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterAction]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('admin_activity_logs')
        .select(`
          *,
          admin_users (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * logsPerPage, currentPage * logsPerPage - 1);

      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Type cast the data to ensure proper types
      const typedLogs: ActivityLog[] = (data || []).map(log => ({
        ...log,
        ip_address: log.ip_address ? String(log.ip_address) : null,
        user_agent: log.user_agent ? String(log.user_agent) : null,
      }));

      setLogs(typedLogs);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select(`
          *,
          admin_users (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Convert to CSV
      const headers = ['Date', 'Admin', 'Action', 'Target Type', 'Description', 'IP Address', 'User Agent'];
      const csvContent = [
        headers.join(','),
        ...data.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.admin_users?.full_name || 'Unknown',
          log.action_type,
          log.target_type || 'N/A',
          `"${log.description}"`,
          log.ip_address || 'Unknown',
          `"${log.user_agent || 'Unknown'}"`
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `admin_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Activity logs exported successfully",
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Error",
        description: "Failed to export logs",
        variant: "destructive",
      });
    }
  };

  const getActionBadge = (actionType: string) => {
    const colors: { [key: string]: string } = {
      login: 'bg-green-600',
      logout: 'bg-gray-600',
      create: 'bg-blue-600',
      update: 'bg-yellow-600',
      delete: 'bg-red-600',
      block: 'bg-red-600',
      unblock: 'bg-green-600',
      payment: 'bg-purple-600',
      notification: 'bg-cyan-600',
    };

    return (
      <Badge className={colors[actionType] || 'bg-gray-600'}>
        {actionType}
      </Badge>
    );
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Filter logs based on search term
  const filteredLogs = logs.filter(log =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin_users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin_users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalLogs: logs.length,
    uniqueAdmins: new Set(logs.map(log => log.admin_users?.email)).size,
    todayLogs: logs.filter(log => {
      const today = new Date().toDateString();
      return new Date(log.created_at).toDateString() === today;
    }).length,
    loginCount: logs.filter(log => log.action_type === 'login').length,
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
          <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
          <p className="text-slate-400">Track all administrative actions and system activities</p>
        </div>
        <Button onClick={exportLogs} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Activities</CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalLogs}</div>
            <p className="text-xs text-slate-400 mt-1">Current page</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Admins</CardTitle>
            <User className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.uniqueAdmins}</div>
            <p className="text-xs text-slate-400 mt-1">Unique users</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Today's Activity</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.todayLogs}</div>
            <p className="text-xs text-slate-400 mt-1">Actions today</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Login Sessions</CardTitle>
            <Monitor className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.loginCount}</div>
            <p className="text-xs text-slate-400 mt-1">Login events</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="block">Block</SelectItem>
            <SelectItem value="unblock">Unblock</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Logs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-slate-400">
            Detailed log of all administrative actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No activity logs found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">
                        {log.admin_users?.full_name || 'Unknown Admin'}
                      </span>
                      {getActionBadge(log.action_type)}
                      <span className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{log.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {log.admin_users?.email && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.admin_users.email}</span>
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{log.ip_address}</span>
                        </div>
                      )}
                      {log.target_type && (
                        <div className="flex items-center gap-1">
                          <span>Target: {log.target_type}</span>
                        </div>
                      )}
                    </div>
                    {log.user_agent && (
                      <div className="mt-1 text-xs text-slate-600 truncate">
                        <Monitor className="h-3 w-3 inline mr-1" />
                        {log.user_agent}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Previous
          </Button>
          <div className="flex items-center px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;