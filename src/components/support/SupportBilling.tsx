import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CreditCard, DollarSign, Calendar, AlertCircle, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SupportBilling = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [extendMonths, setExtendMonths] = useState('1');

  const { data: institutions, isLoading, refetch } = useQuery({
    queryKey: ['billing-institutions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('admin_institutions')
        .select('*')
        .order('subscription_expires_at', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['billing-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_institutions')
        .select('subscription_status, subscription_expires_at');
      
      if (error) throw error;

      const now = new Date();
      const active = data.filter(i => i.subscription_status === 'active' && new Date(i.subscription_expires_at) > now).length;
      const expired = data.filter(i => i.subscription_status === 'expired' || new Date(i.subscription_expires_at) <= now).length;
      const expiring_soon = data.filter(i => {
        const daysUntilExpiry = Math.ceil((new Date(i.subscription_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length;

      return {
        active,
        expired,
        expiring_soon,
        total: data.length,
        revenue: active * 5000 // Assuming KES 5000 per subscription
      };
    },
  });

  const handleExtendSubscription = async () => {
    if (!selectedInstitution) return;

    try {
      const currentExpiry = new Date(selectedInstitution.subscription_expires_at);
      const newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + parseInt(extendMonths));

      const { error } = await supabase
        .from('admin_institutions')
        .update({
          subscription_expires_at: newExpiry.toISOString(),
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedInstitution.id);

      if (error) throw error;

      toast.success(`Subscription extended by ${extendMonths} month(s)`);
      setSelectedInstitution(null);
      refetch();
    } catch (error: any) {
      toast.error('Failed to extend subscription: ' + error.message);
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusBadge = (status: string, expiryDate: string) => {
    const days = getDaysRemaining(expiryDate);
    
    if (days <= 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (days <= 7) {
      return <Badge variant="destructive">Expires in {days}d</Badge>;
    } else if (days <= 30) {
      return <Badge variant="default">Expires in {days}d</Badge>;
    } else {
      return <Badge variant="secondary">Active</Badge>;
    }
  };

  const filteredInstitutions = institutions?.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Billing & Subscriptions</h2>
          <p className="text-muted-foreground">Manage institution subscriptions and payments</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats?.revenue?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly recurring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active}</div>
            <p className="text-xs text-muted-foreground">Subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiring_soon}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expired}</div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total}</div>
            <p className="text-xs text-muted-foreground">Registered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>View and manage all institution subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search institutions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Payment Ref</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstitutions?.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell className="font-medium">{institution.name}</TableCell>
                    <TableCell>{institution.username}</TableCell>
                    <TableCell>
                      {getStatusBadge(institution.subscription_status, institution.subscription_expires_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(institution.subscription_expires_at).toLocaleDateString()}
                        <span className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(new Date(institution.subscription_expires_at), { addSuffix: true })})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{institution.payment_reference || 'N/A'}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedInstitution(institution)}
                          >
                            Extend
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Extend Subscription</DialogTitle>
                            <DialogDescription>
                              Extend subscription for {selectedInstitution?.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Current Expiry</Label>
                              <p className="text-sm text-muted-foreground">
                                {selectedInstitution && new Date(selectedInstitution.subscription_expires_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label>Extend by (months)</Label>
                              <Select value={extendMonths} onValueChange={setExtendMonths}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 Month</SelectItem>
                                  <SelectItem value="3">3 Months</SelectItem>
                                  <SelectItem value="6">6 Months</SelectItem>
                                  <SelectItem value="12">12 Months</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleExtendSubscription}>
                              Confirm Extension
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportBilling;
