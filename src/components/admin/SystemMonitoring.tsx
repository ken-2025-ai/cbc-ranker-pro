import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Database, Archive, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

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

export default function SystemMonitoring() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats[]>([]);
  const [recentBackups, setRecentBackups] = useState<BackupLog[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);

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

  useEffect(() => {
    fetchStorageStats();
    fetchRecentBackups();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">Monitor storage usage and cleanup operations</p>
        </div>
        <Button onClick={runManualCleanup} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Run Cleanup
        </Button>
      </div>

      {/* Storage Statistics */}
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
