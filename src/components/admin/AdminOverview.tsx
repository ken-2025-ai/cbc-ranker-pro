import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { 
  Building, 
  CreditCard, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  totalInstitutions: number;
  activeInstitutions: number;
  expiredInstitutions: number;
  unpaidInstitutions: number;
  totalRevenue: number;
  recentLogins: number;
}

const AdminOverview = () => {
  const { sessionToken } = useAdminAuth();
  const [stats, setStats] = useState<Stats>({
    totalInstitutions: 0,
    activeInstitutions: 0,
    expiredInstitutions: 0,
    unpaidInstitutions: 0,
    totalRevenue: 0,
    recentLogins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch institution statistics
      const { data: institutions, error: instError } = await supabase
        .from('admin_institutions')
        .select('subscription_status, subscription_expires_at, last_login, created_at');

      if (instError) {
        console.error('Error fetching institutions:', instError);
        setLoading(false);
        return;
      }

      // Calculate statistics
      const now = new Date();
      const totalInstitutions = institutions?.length || 0;
      const activeInstitutions = institutions?.filter(inst => 
        inst.subscription_status === 'paid' && 
        new Date(inst.subscription_expires_at) > now
      ).length || 0;
      const expiredInstitutions = institutions?.filter(inst => 
        inst.subscription_status === 'paid' && 
        new Date(inst.subscription_expires_at) <= now
      ).length || 0;
      const unpaidInstitutions = institutions?.filter(inst => 
        inst.subscription_status === 'unpaid'
      ).length || 0;

      // Recent logins (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentLogins = institutions?.filter(inst => 
        inst.last_login && new Date(inst.last_login) > weekAgo
      ).length || 0;

      // Fetch payment statistics
      const { data: payments } = await supabase
        .from('payment_history')
        .select('amount');

      const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      setStats({
        totalInstitutions,
        activeInstitutions,
        expiredInstitutions,
        unpaidInstitutions,
        totalRevenue,
        recentLogins,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Data for pie chart
  const subscriptionData = [
    { name: 'Active', value: stats.activeInstitutions, color: '#10b981' },
    { name: 'Expired', value: stats.expiredInstitutions, color: '#f59e0b' },
    { name: 'Unpaid', value: stats.unpaidInstitutions, color: '#ef4444' },
  ];

  // Data for bar chart (dummy data for now)
  const revenueData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 15000 },
    { month: 'Mar', revenue: 18000 },
    { month: 'Apr', revenue: 22000 },
    { month: 'May', revenue: 19000 },
    { month: 'Jun', revenue: 25000 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Welcome to the CBC Pro Ranker administrative control panel</p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Institutions</CardTitle>
            <Building className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalInstitutions}</div>
            <p className="text-xs text-slate-400 mt-1">Registered schools</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeInstitutions}</div>
            <p className="text-xs text-slate-400 mt-1">Currently paying</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Expired/Unpaid</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.expiredInstitutions + stats.unpaidInstitutions}</div>
            <p className="text-xs text-slate-400 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Recent Logins</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.recentLogins}</div>
            <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status Pie Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Subscription Status</CardTitle>
            <CardDescription className="text-slate-400">Distribution of institution subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend Bar Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend</CardTitle>
            <CardDescription className="text-slate-400">Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              KSh {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-slate-400 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">25,000</div>
            <p className="text-sm text-slate-400 mt-1">KSh revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-400" />
              Average Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              KSh {stats.totalInstitutions > 0 ? Math.round(stats.totalRevenue / stats.totalInstitutions).toLocaleString() : 0}
            </div>
            <p className="text-sm text-slate-400 mt-1">Per institution</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;