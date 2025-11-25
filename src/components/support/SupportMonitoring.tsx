import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Database, HardDrive, Cpu, TrendingUp, RefreshCw } from 'lucide-react';

const SupportMonitoring = () => {
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-analytics');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">Real-time system performance and health metrics</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {analytics?.alerts && analytics.alerts.slice(0, 3).map((alert: any, idx: number) => (
        <Alert key={idx} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{alert.title}</strong>: {alert.message}
          </AlertDescription>
        </Alert>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Load</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.system?.cpu_percent?.toFixed(1)}%</div>
            <Progress value={analytics?.system?.cpu_percent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAM Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.system?.ram_percent?.toFixed(1)}%</div>
            <Progress value={analytics?.system?.ram_percent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.storage?.disk_usage_percent?.toFixed(1)}%</div>
            <Progress value={analytics?.storage?.disk_usage_percent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performance?.overall_score?.toFixed(0)}</div>
            <Badge variant="secondary" className="mt-2">{analytics?.performance?.grade}</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CPU Usage History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.system?.cpu_history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="usage" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RAM Usage History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.system?.ram_history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="usage" stroke="hsl(var(--chart-1))" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Storage by Module</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={analytics?.storage?.by_module} dataKey="size_mb" nameKey="module" cx="50%" cy="50%" outerRadius={80} label>
                      {analytics?.storage?.by_module?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Used</span>
                    <span>{analytics?.storage?.used_gb?.toFixed(2)} GB</span>
                  </div>
                  <Progress value={(analytics?.storage?.used_gb / analytics?.storage?.total_gb) * 100} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{analytics?.storage?.total_records?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">{analytics?.storage?.available_gb?.toFixed(2)} GB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Health</CardTitle>
              <CardDescription>Query performance and index health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Query Latency</p>
                  <p className="text-2xl font-bold">{analytics?.database?.avg_query_latency_ms?.toFixed(0)} ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tables</p>
                  <p className="text-2xl font-bold">{analytics?.database?.total_tables}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Table Health</h4>
                <div className="space-y-2">
                  {analytics?.database?.table_health?.map((table: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm">{table.table_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{table.row_count.toLocaleString()} rows</span>
                        <Badge variant={table.health_status === 'healthy' ? 'secondary' : 'destructive'}>
                          {table.health_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Forecast</CardTitle>
              <CardDescription>Predicted storage exhaustion based on current growth rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    {analytics?.forecast?.storage_runout_days > 365 
                      ? `Storage sufficient for over ${Math.floor(analytics?.forecast?.storage_runout_days / 365)} years`
                      : `Storage may run out in approximately ${analytics?.forecast?.storage_runout_days} days`
                    }
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                    <p className="text-xl font-bold">{analytics?.forecast?.growth_rate_mb_per_day?.toFixed(2)} MB/day</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User Growth</p>
                    <p className="text-xl font-bold">+{analytics?.forecast?.estimated_user_growth_monthly} /month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {analytics?.suggestions && (
        <Card>
          <CardHeader>
            <CardTitle>AI Optimization Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.suggestions.map((suggestion: any, idx: number) => (
                <Alert key={idx}>
                  <AlertDescription>
                    <strong>{suggestion.category}</strong>: {suggestion.suggestion}
                    {suggestion.impact && <span className="text-sm text-muted-foreground ml-2">Impact: {suggestion.impact}</span>}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupportMonitoring;
