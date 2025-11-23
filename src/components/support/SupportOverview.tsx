import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Ticket, Server, HardDrive, Cpu, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SupportOverview = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalTickets: 0,
    openTickets: 0,
    activeUsers24h: 0
  });
  const [systemMetrics, setSystemMetrics] = useState({
    storageUsedMB: 0,
    ramUsageMB: 0,
    cpuUsagePercent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchSystemMetrics, 3000); // Refresh every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const sessionToken = localStorage.getItem('support_session_token');
      const { data, error } = await supabase.functions.invoke('support-operations', {
        body: {
          action: 'get_dashboard_stats',
          session_token: sessionToken
        }
      });

      if (error) throw error;
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const sessionToken = localStorage.getItem('support_session_token');
      const { data, error } = await supabase.functions.invoke('support-operations', {
        body: {
          action: 'get_system_metrics',
          session_token: sessionToken
        }
      });

      if (error) throw error;
      if (data.success) {
        setSystemMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const statCards = [
    { title: 'Total Schools', value: stats.totalSchools, icon: Building2, color: 'text-blue-500' },
    { title: 'Total Tickets', value: stats.totalTickets, icon: Ticket, color: 'text-purple-500' },
    { title: 'Open Tickets', value: stats.openTickets, icon: TrendingUp, color: 'text-orange-500' },
    { title: 'Active Users (24h)', value: stats.activeUsers24h, icon: Users, color: 'text-green-500' }
  ];

  const metricCards = [
    { title: 'Storage Usage', value: `${systemMetrics.storageUsedMB} MB`, icon: HardDrive, color: 'text-cyan-500' },
    { title: 'RAM Usage', value: `${systemMetrics.ramUsageMB} MB`, icon: Server, color: 'text-yellow-500' },
    { title: 'CPU Usage', value: `${systemMetrics.cpuUsagePercent}%`, icon: Cpu, color: 'text-red-500' }
  ];

  // Mock data for graphs (replace with real data)
  const mockGraphData = Array.from({ length: 10 }, (_, i) => ({
    time: `${i}m`,
    value: Math.random() * 100
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage the CBC Pro Ranker platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="h-16 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockGraphData}>
                      <Area type="monotone" dataKey="value" stroke={metric.color.replace('text-', '')} fill={metric.color.replace('text-', '')} fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Graphs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Storage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockGraphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockGraphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportOverview;
