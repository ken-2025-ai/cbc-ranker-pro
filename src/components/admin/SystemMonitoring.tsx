import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Activity, Database, HardDrive, Network, Cpu, MemoryStick,
  AlertTriangle, TrendingUp, RefreshCw, Building, Zap, Clock
} from "lucide-react";
import { toast } from "sonner";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function SystemMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['system-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-analytics');
      if (error) throw error;
      return data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">Real-time performance, CPU, RAM, storage & network analytics</p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Critical Alerts */}
      {analytics?.alerts && analytics.alerts.length > 0 && (
        <div className="space-y-2">
          {analytics.alerts.slice(0, 3).map((alert: any, i: number) => (
            <Alert key={i} variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.message}</strong> - {alert.action}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Load</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.cpu?.currentLoad?.toFixed(1) || 0}%
            </div>
            <Progress value={analytics?.cpu?.currentLoad || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {analytics?.cpu?.currentLoad > 70 ? 'High' : analytics?.cpu?.currentLoad > 40 ? 'Normal' : 'Low'} usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAM Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.ram?.used?.toFixed(0) || 0} MB
            </div>
            <Progress value={analytics?.ram?.used_percent || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              of {analytics?.ram?.total || 512} MB total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.disk?.used_gb?.toFixed(2) || 0} GB
            </div>
            <Progress value={analytics?.disk?.used_percent || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {analytics?.disk?.remaining_gb?.toFixed(2) || 0} GB remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.performance?.overall_score || 0}/100
            </div>
            <Badge variant="secondary" className="mt-2">
              {analytics?.performance?.grade || 'N/A'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              System health
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Institutions</CardTitle>
                <CardDescription>Schools currently using the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{analytics?.usage?.active_institutions || 0}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {analytics?.usage?.total_devices || 0} total devices registered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>Recent 24h operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{analytics?.usage?.activity_24h || 0}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Daily average: {analytics?.usage?.daily_avg || 0} operations
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Optimization Suggestions</CardTitle>
              <CardDescription>Smart recommendations for system improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {analytics?.aiSuggestions?.map((suggestion: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getSeverityColor(suggestion.severity)}>
                              {suggestion.impact || 'medium'}
                            </Badge>
                            <Badge variant="outline">{suggestion.category}</Badge>
                          </div>
                          <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Effort: {suggestion.effort} | Impact: {suggestion.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">No suggestions at this time</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CPU Load History</CardTitle>
                <CardDescription>Last 20 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analytics?.cpu?.history || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="load" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RAM Usage History</CardTitle>
                <CardDescription>Memory consumption over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics?.ram?.history || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="used" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>CPU Heatmap by Module</CardTitle>
              <CardDescription>Computational cost per operation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics?.cpu?.heatmap || {}).map(([name, value]) => ({ name, load: value }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="load" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Storage by Module</CardTitle>
                <CardDescription>Data distribution across modules</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics?.storage?.per_module || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(analytics?.storage?.per_module || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Details</CardTitle>
                <CardDescription>Detailed breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Used:</span>
                  <span className="font-bold">{analytics?.disk?.used_gb?.toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Capacity:</span>
                  <span className="font-bold">{analytics?.disk?.total_gb} GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Remaining:</span>
                  <span className="font-bold text-green-600">{analytics?.disk?.remaining_gb?.toFixed(2)} GB</span>
                </div>
                <Progress value={analytics?.disk?.used_percent || 0} />
                <p className="text-xs text-muted-foreground">
                  {analytics?.storage?.total_records || 0} total records in database
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Storage by School</CardTitle>
              <CardDescription>Per-institution data usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {analytics?.storage?.per_school?.map((school: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{school.school_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {school.students} students, {school.marks} marks
                        </p>
                      </div>
                      <Badge>{school.total_records} records</Badge>
                    </div>
                  )) || <p className="text-muted-foreground">No data available</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Query Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.database?.queryLatency?.toFixed(0) || 0}ms</div>
                <p className="text-xs text-muted-foreground mt-2">Average response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Index Health</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-lg">{analytics?.database?.indexHealth || 'N/A'}</Badge>
                <p className="text-xs text-muted-foreground mt-2">Database optimization status</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Object.keys(analytics?.database?.tableHealth || {}).length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Active database tables</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Table Health & Performance</CardTitle>
              <CardDescription>Size and operation frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {Object.entries(analytics?.database?.tableHealth || {}).map(([table, health]: [string, any]) => (
                    <div key={table} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{table}</h4>
                        <Badge variant="outline">{health.size_mb} MB</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reads:</span> {health.read_freq}/min
                        </div>
                        <div>
                          <span className="text-muted-foreground">Writes:</span> {health.write_freq}/min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Storage Forecast</CardTitle>
                <CardDescription>Predictive analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Storage runs out in:</p>
                  <p className="text-3xl font-bold">{analytics?.forecast?.storageRunOutInDays || '∞'} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Growth rate:</p>
                  <p className="text-xl font-bold">{analytics?.forecast?.growth_rate_percent?.toFixed(1)}% /month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected usage (30d):</p>
                  <Progress value={analytics?.forecast?.projected_usage_30d || 0} className="mt-2" />
                  <p className="text-sm mt-1">{analytics?.forecast?.projected_usage_30d?.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Prediction</CardTitle>
                <CardDescription>System health forecast</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold capitalize">{analytics?.forecast?.performancePrediction || 'Stable'}</p>
                    <p className="text-sm text-muted-foreground">Expected status</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Projected Users (30d):</span>
                    <span className="font-bold">{analytics?.forecast?.projected_users_30d || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Current Active:</span>
                    <span className="font-bold">{analytics?.usage?.active_institutions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Active warnings and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {analytics?.alerts?.map((alert: any, i: number) => (
                    <Alert key={i} variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div>
                            <strong>{alert.message}</strong>
                            <p className="text-xs mt-1">{alert.action}</p>
                          </div>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )) || <p className="text-muted-foreground">No active alerts</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
