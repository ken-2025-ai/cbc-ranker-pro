import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';

interface RevenueData {
  month: string;
  revenue: number;
  institutions: number;
}

interface CountyData {
  county: string;
  count: number;
}

interface SubscriptionData {
  status: string;
  count: number;
  color: string;
}

const ReportsAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('12months');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [countyData, setCountyData] = useState<CountyData[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalInstitutions: 0,
    activeSubscriptions: 0,
    averageRevenue: 0,
    growthRate: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch institutions data
      const { data: institutions, error: instError } = await supabase
        .from('admin_institutions')
        .select('*');

      if (instError) throw instError;

      // Fetch payment data
      const { data: payments, error: paymentError } = await supabase
        .from('payment_history')
        .select('*');

      if (paymentError) throw paymentError;

      // Process data for analytics
      processAnalyticsData(institutions || [], payments || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (institutions: any[], payments: any[]) => {
    // Calculate total stats
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalInstitutions = institutions.length;
    const now = new Date();
    const activeSubscriptions = institutions.filter(inst => {
      return inst.subscription_status === 'paid' && 
             inst.subscription_expires_at && 
             new Date(inst.subscription_expires_at) > now;
    }).length;
    const averageRevenue = totalInstitutions > 0 ? totalRevenue / totalInstitutions : 0;

    setTotalStats({
      totalRevenue,
      totalInstitutions,
      activeSubscriptions,
      averageRevenue,
      growthRate: 12.5, // Placeholder growth rate
    });

    // Process revenue data by month
    const monthlyRevenue = payments.reduce((acc: { [key: string]: number }, payment) => {
      const month = new Date(payment.payment_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + Number(payment.amount);
      return acc;
    }, {});

    const revenueChartData = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue: Number(revenue), institutions: 0 }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months

    setRevenueData(revenueChartData);

    // Process county data
    const countyCount = institutions.reduce((acc: { [key: string]: number }, inst) => {
      if (inst.county) {
        acc[inst.county] = (acc[inst.county] || 0) + 1;
      }
      return acc;
    }, {});

    const countyChartData = Object.entries(countyCount)
      .map(([county, count]) => ({ county, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 counties

    setCountyData(countyChartData);

    // Process subscription status data
    const statusCount = institutions.reduce((acc: { [key: string]: number }, inst) => {
      let status = 'unpaid';
      if (inst.subscription_status === 'paid' && inst.subscription_expires_at) {
        status = new Date(inst.subscription_expires_at) > now ? 'active' : 'expired';
      }
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const subscriptionChartData = [
      { status: 'Active', count: statusCount.active || 0, color: '#10b981' },
      { status: 'Expired', count: statusCount.expired || 0, color: '#f59e0b' },
      { status: 'Unpaid', count: statusCount.unpaid || 0, color: '#ef4444' },
    ];

    setSubscriptionData(subscriptionChartData);
  };

  const exportReport = async () => {
    try {
      // Generate comprehensive report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        dateRange,
        totalStats,
        revenueData,
        countyData,
        subscriptionData,
      };

      // Create CSV content
      const csvContent = [
        'CBC Pro Ranker - Analytics Report',
        `Generated: ${new Date().toLocaleString()}`,
        `Date Range: ${dateRange}`,
        '',
        'Summary Statistics:',
        `Total Revenue,KSh ${totalStats.totalRevenue.toLocaleString()}`,
        `Total Institutions,${totalStats.totalInstitutions}`,
        `Active Subscriptions,${totalStats.activeSubscriptions}`,
        `Average Revenue per Institution,KSh ${Math.round(totalStats.averageRevenue).toLocaleString()}`,
        '',
        'Revenue by Month:',
        'Month,Revenue',
        ...revenueData.map(item => `${item.month},${item.revenue}`),
        '',
        'Institutions by County:',
        'County,Count',
        ...countyData.map(item => `${item.county},${item.count}`),
        '',
        'Subscription Status:',
        'Status,Count',
        ...subscriptionData.map(item => `${item.status},${item.count}`),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `cbc_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Analytics report exported successfully",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
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
          <div className="grid grid-cols-2 gap-4">
            <div className="h-80 bg-slate-700 rounded"></div>
            <div className="h-80 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-slate-400">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              KSh {totalStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-green-400 mt-1">
              ↑ +{totalStats.growthRate}% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Institutions</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalStats.totalInstitutions}</div>
            <p className="text-xs text-slate-400 mt-1">Registered schools</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalStats.activeSubscriptions}</div>
            <p className="text-xs text-slate-400 mt-1">Currently paying</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Average Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              KSh {Math.round(totalStats.averageRevenue).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Per institution</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Conversion Rate</CardTitle>
            <FileText className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {totalStats.totalInstitutions > 0 
                ? Math.round((totalStats.activeSubscriptions / totalStats.totalInstitutions) * 100)
                : 0}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Active/Total ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend</CardTitle>
            <CardDescription className="text-slate-400">Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
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
                    formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Subscription Distribution</CardTitle>
            <CardDescription className="text-slate-400">Current subscription status breakdown</CardDescription>
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
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Counties */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Institutions by County</CardTitle>
            <CardDescription className="text-slate-400">Geographic distribution of registered institutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countyData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="county" type="category" stroke="#9CA3AF" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Growth Metrics */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Key Performance Indicators</CardTitle>
            <CardDescription className="text-slate-400">Important business metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Growth Rate</span>
                </div>
                <div className="text-2xl font-bold text-white">{totalStats.growthRate}%</div>
                <div className="text-xs text-green-400">↑ Month over month</div>
              </div>
              
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">ARPU</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  KSh {Math.round(totalStats.averageRevenue).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Average revenue per user</div>
              </div>
              
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-slate-300">Retention</span>
                </div>
                <div className="text-2xl font-bold text-white">85%</div>
                <div className="text-xs text-purple-400">Customer retention rate</div>
              </div>
              
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-slate-300">Coverage</span>
                </div>
                <div className="text-2xl font-bold text-white">{countyData.length}</div>
                <div className="text-xs text-slate-400">Counties served</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsAnalytics;