import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, Database, Archive, AlertTriangle, CheckCircle, Clock, 
  Activity, Wifi, Users, TrendingUp, Zap, HardDrive, Server, 
  BarChart3, FileText, AlertCircle, Building
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface CleanupStats {
  table_name: string;
  rows_cleaned: number;
}

interface BackupLog {
  id: string;
  institution_id: string;
  backup_type: string;
  status: string;
  created_at: string;
  error_message: string | null;
  expires_at: string | null;
  file_size_bytes: number | null;
}

interface StorageStats {
  marks_active_count: number;
  students_meta_count: number;
  rankings_cache_count: number;
  expired_marks_count: number;
}

interface SystemAnalytics {
  storage: {
    total_records: number;
    estimated_size_mb: number;
    estimated_size_gb: number;
    breakdown: Record<string, number>;
    per_school: Array<{
      school_id: string;
      school_name: string;
      students: number;
      marks: number;
      total_records: number;
    }>;
    capacity_used_percent: number;
  };
  performance: {
    overall_score: number;
    modules: Array<{
      module: string;
      response_time_ms: number;
      status: string;
      score: number;
    }>;
    grade: string;
  };
  network: {
    requests_24h: number;
    estimated_bandwidth_mb: string;
    efficiency_grade: string;
    avg_request_size_kb: number;
  };
  usage: {
    active_institutions: number;
    total_devices: number;
    activity_24h: number;
    activity_7d: number;
    daily_avg: number;
    monthly_projection: number;
  };
  alerts: Array<{
    severity: string;
    type: string;
    message: string;
    action: string;
  }>;
  suggestions: Array<{
    category: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
  }>;
  timestamp: string;
}

export default function SystemMonitoring() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats[]>([]);
  const [recentBackups, setRecentBackups] = useState<BackupLog[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);

  const fetchStorageStats = async () => {
    try {
      const [marksCount, studentsCount, rankingsCount, expiredCount] = await Promise.all([
        supabase.from('marks_active').select('*', { count: 'exact', head: true }),
        supabase.from('students_meta').select('*', { count: 'exact', head: true }),
        supabase.from('rankings_cache').select('*', { count: 'exact', head: true }),
        supabase.from('marks_active').select('*', { count: 'exact', head: true })
          .lt('expires_at', new Date().toISOString())
      ]);

      setStorageStats({
        marks_active_count: marksCount.count || 0,
        students_meta_count: studentsCount.count || 0,
        rankings_cache_count: rankingsCount.count || 0,
        expired_marks_count: expiredCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    }
  };

  const fetchRecentBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentBackups(data || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const runManualCleanup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('run_scheduled_cleanup');
      
      if (error) throw error;
      
      setCleanupStats(data || []);
      setLastCleanup(new Date().toISOString());
      
      toast({
        title: "Cleanup completed",
        description: `Cleaned ${data?.reduce((sum: number, stat: CleanupStats) => sum + stat.rows_cleaned, 0) || 0} total rows`,
      });
      
      await fetchStorageStats();
      await fetchRecentBackups();
    } catch (error: any) {
      toast({
        title: "Cleanup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemAnalytics = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-analytics');
      
      if (error) throw error;
      setAnalytics(data);
    } catch (error: any) {
      toast({
        title: "Failed to fetch analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStorageStats();
    fetchRecentBackups();
    fetchSystemAnalytics();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-info text-info-foreground';
      default: return 'bg-secondary';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>;
      case 'medium': return <Badge className="bg-warning">Medium Impact</Badge>;
      case 'low': return <Badge variant="secondary">Low Impact</Badge>;
      default: return <Badge variant="outline">{impact}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Usage Monitor</h2>
          <p className="text-muted-foreground">Complete backend system monitoring and analytics</p>
          {analytics && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {format(new Date(analytics.timestamp), 'PPpp')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSystemAnalytics} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={runManualCleanup} disabled={loading}>
            <Database className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Cleanup
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {analytics?.alerts && analytics.alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              System Alerts ({analytics.alerts.length})
            </CardTitle>
            <CardDescription>Critical issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{alert.message}</p>
                      <p className="text-sm opacity-90">{alert.action}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">{alert.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analytics?.performance.overall_score || 0}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Grade: {analytics?.performance.grade || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.storage.estimated_size_mb.toFixed(1) || 0} MB
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.storage.capacity_used_percent.toFixed(1) || 0}% capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.usage.active_institutions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.usage.total_devices || 0} total devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Network Health</CardTitle>
            <Wifi className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {analytics?.network.efficiency_grade || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.network.requests_24h || 0} requests/24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {analytics?.performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Module Performance
            </CardTitle>
            <CardDescription>Response times across all modules</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.performance.modules}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="module" className="text-xs" />
                <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="response_time_ms" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Storage Breakdown */}
      {analytics?.storage && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Storage Distribution
              </CardTitle>
              <CardDescription>Records per table</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.storage.breakdown).map(([name, value]) => ({
                      name,
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {Object.entries(analytics.storage.breakdown).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Storage Per School
              </CardTitle>
              <CardDescription>Top institutions by data usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.storage.per_school.slice(0, 5).map((school, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{school.school_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {school.students} students, {school.marks} marks
                      </p>
                    </div>
                    <Badge variant="outline">{school.total_records} records</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Statistics */}
      {analytics?.usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage Trends
            </CardTitle>
            <CardDescription>Activity metrics and projections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Last 24 Hours</p>
                <p className="text-3xl font-bold">{analytics.usage.activity_24h}</p>
                <p className="text-xs text-muted-foreground">activities</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                <p className="text-3xl font-bold">{analytics.usage.daily_avg}</p>
                <p className="text-xs text-muted-foreground">activities/day</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Projection</p>
                <p className="text-3xl font-bold">{analytics.usage.monthly_projection}</p>
                <p className="text-xs text-muted-foreground">activities/month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Suggestions */}
      {analytics?.suggestions && analytics.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Optimization Recommendations ({analytics.suggestions.length})
            </CardTitle>
            <CardDescription>AI-powered suggestions to improve system performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {getImpactBadge(suggestion.impact)}
                      <Badge variant="outline">{suggestion.effort} effort</Badge>
                    </div>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground">{suggestion.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Storage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Storage Metrics</CardTitle>
          <CardDescription>Real-time database statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Marks</CardTitle>
                <Database className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storageStats?.marks_active_count.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Currently stored</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Students Metadata</CardTitle>
                <Database className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storageStats?.students_meta_count.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Student records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Rankings Cache</CardTitle>
                <Database className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storageStats?.rankings_cache_count.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Cached entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expired Records</CardTitle>
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {storageStats?.expired_marks_count.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting cleanup</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Last Cleanup Results */}
      {cleanupStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Last Cleanup Results</CardTitle>
            <CardDescription>
              {lastCleanup && `Executed on ${format(new Date(lastCleanup), 'PPpp')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cleanupStats.map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">{stat.table_name}</span>
                  <Badge variant="outline">{stat.rows_cleaned} rows cleaned</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Recent Backups
          </CardTitle>
          <CardDescription>Last 10 backup operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBackups.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No backup logs found</p>
            ) : (
              recentBackups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between border-b pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{backup.backup_type}</span>
                      {getStatusBadge(backup.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(backup.created_at), 'PPpp')}
                    </p>
                    {backup.error_message && (
                      <p className="text-sm text-destructive">{backup.error_message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {backup.file_size_bytes && (
                      <p className="text-sm font-medium">
                        {(backup.file_size_bytes / 1024).toFixed(2)} KB
                      </p>
                    )}
                    {backup.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {format(new Date(backup.expires_at), 'PP')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
