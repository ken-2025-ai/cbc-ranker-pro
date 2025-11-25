import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, Shield, FileText, RefreshCw, Search, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SupportActivityLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [logType, setLogType] = useState('all');

  const { data: supportLogs, isLoading: supportLoading, refetch: refetchSupport } = useQuery({
    queryKey: ['support-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_activity_logs')
        .select('*, support_staff(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: adminLogs, isLoading: adminLoading, refetch: refetchAdmin } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*, admin_users(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: deviceLogs, isLoading: deviceLoading, refetch: refetchDevice } = useQuery({
    queryKey: ['device-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_sessions')
        .select('*, admin_institutions(name)')
        .order('last_active', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: helpTickets, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['help-tickets-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
      case 'authentication':
        return <User className="h-4 w-4" />;
      case 'block':
      case 'unblock':
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'ticket':
      case 'support':
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('block') || actionType.includes('delete')) {
      return <Badge variant="destructive">{actionType}</Badge>;
    } else if (actionType.includes('create') || actionType.includes('success')) {
      return <Badge variant="secondary">{actionType}</Badge>;
    } else {
      return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'in_progress':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const renderLogsByType = () => {
    const isLoading = supportLoading || adminLoading || deviceLoading || ticketsLoading;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (logType) {
      case 'support':
        return (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supportLogs?.filter(log => 
                  log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  log.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_type)}
                        <div>
                          <p className="font-medium">{log.support_staff?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{log.support_staff?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action_type)}</TableCell>
                    <TableCell className="max-w-md truncate">{log.description}</TableCell>
                    <TableCell className="font-mono text-xs">{String(log.ip_address || 'N/A')}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        );

      case 'admin':
        return (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminLogs?.filter(log => 
                  log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  log.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_type)}
                        <div>
                          <p className="font-medium">{log.admin_users?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{log.admin_users?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action_type)}</TableCell>
                    <TableCell className="max-w-md truncate">{log.description}</TableCell>
                    <TableCell>{log.target_type || 'N/A'}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        );

      case 'devices':
        return (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviceLogs?.filter(log => 
                  log.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  log.admin_institutions?.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.device_name}</p>
                        <p className="text-xs text-muted-foreground">{log.device_type}</p>
                      </div>
                    </TableCell>
                    <TableCell>{log.admin_institutions?.name}</TableCell>
                    <TableCell>
                      {log.is_blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.location_city && `${log.location_city}, ${log.location_country}`}
                    </TableCell>
                    <TableCell>
                      {log.last_active && formatDistanceToNow(new Date(log.last_active), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        );

      case 'tickets':
        return (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {helpTickets?.filter(ticket => 
                  ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  ticket.issue_type.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                    <TableCell>{getActionBadge(ticket.issue_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <Badge variant="outline">{ticket.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{ticket.email}</p>
                        <p className="text-xs text-muted-foreground">{ticket.phone_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        );

      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Support Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {supportLogs?.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 border-b pb-3">
                        {getActionIcon(log.action_type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.action_type}</p>
                          <p className="text-xs text-muted-foreground">{log.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {helpTickets?.slice(0, 10).map((ticket) => (
                      <div key={ticket.id} className="flex items-start gap-3 border-b pb-3">
                        {getStatusIcon(ticket.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ticket.ticket_number}</p>
                          <p className="text-xs text-muted-foreground">{ticket.issue_type}</p>
                          <Badge variant="outline" className="mt-1">{ticket.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Activity Logs</h2>
          <p className="text-muted-foreground">Monitor all system activities and user actions</p>
        </div>
        <Button 
          onClick={() => {
            refetchSupport();
            refetchAdmin();
            refetchDevice();
            refetchTickets();
          }} 
          variant="outline" 
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportLogs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminLogs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceLogs?.filter(d => !d.is_blocked).length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {helpTickets?.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Monitor</CardTitle>
          <CardDescription>View detailed logs across all system components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Log type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="support">Support Logs</SelectItem>
                <SelectItem value="admin">Admin Logs</SelectItem>
                <SelectItem value="devices">Device Logs</SelectItem>
                <SelectItem value="tickets">Tickets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderLogsByType()}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportActivityLogs;
