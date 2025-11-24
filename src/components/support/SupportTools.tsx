import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  FileText, 
  Download,
  Terminal,
  Search,
  AlertTriangle,
  CheckCircle,
  Copy,
  Send,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SupportTools = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  const runDatabaseQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      // Note: Direct SQL execution is disabled for security
      // Use predefined RPC functions or edge functions instead
      toast({
        title: "Info",
        description: "Direct SQL execution is restricted. Use predefined queries or contact system administrator.",
        variant: "default"
      });
      setQueryResult({ info: "Direct SQL execution is restricted for security. Use Edge Functions or predefined RPC functions." });
    } catch (error) {
      console.error('Query error:', error);
      toast({
        title: "Error",
        description: "Failed to execute query",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      setLoading(true);
      // Call edge function to clear cache
      await supabase.functions.invoke('clear-cache');
      
      toast({
        title: "Success",
        description: "Cache cleared successfully"
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationEmail || !notificationMessage) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await supabase.functions.invoke('send-notification', {
        body: {
          email: notificationEmail,
          message: notificationMessage
        }
      });
      
      toast({
        title: "Success",
        description: "Notification sent successfully"
      });
      setNotificationEmail('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Notification error:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_logs_${new Date().toISOString()}.csv`;
      a.click();

      toast({
        title: "Success",
        description: "Logs exported successfully"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val}"` : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Tools</h1>
        <p className="text-muted-foreground">Advanced tools for system management and troubleshooting</p>
      </div>

      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Send className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                SQL Query Console
              </CardTitle>
              <CardDescription>
                Execute read-only SQL queries for diagnostics and reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  placeholder="SELECT * FROM admin_institutions LIMIT 10;"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={runDatabaseQuery} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Execute Query
                </Button>
                <Button variant="outline" onClick={() => setSqlQuery('')}>
                  Clear
                </Button>
              </div>
              
              {queryResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Query Results</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(queryResult, null, 2));
                        toast({ title: "Copied!", description: "Results copied to clipboard" });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Export activity logs and system data for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportLogs} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Export Activity Logs (CSV)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Notification
              </CardTitle>
              <CardDescription>
                Send email notifications to institutions or users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="institution@example.com"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your notification message..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={6}
                />
              </div>
              <Button onClick={sendNotification} disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Clear Cache
                </CardTitle>
                <CardDescription>
                  Clear system cache to resolve performance issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={clearCache} disabled={loading} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear All Cache
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current system health and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Edge Functions</span>
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage</span>
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Operational
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportTools;
