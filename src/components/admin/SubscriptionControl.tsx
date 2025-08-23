import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  History,
  Timer
} from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  payment_reference: string | null;
}

interface PaymentRecord {
  id: string;
  institution_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  reference_number: string;
  payment_date: string;
  subscription_period_months: number;
  notes: string;
  admin_institutions: {
    name: string;
  };
}

const SubscriptionControl = () => {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'mpesa',
    transactionId: '',
    referenceNumber: '',
    subscriptionMonths: '12',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch institutions
      const { data: instData, error: instError } = await supabase
        .from('admin_institutions')
        .select('id, name, subscription_status, subscription_expires_at, payment_reference')
        .order('name');

      if (instError) throw instError;

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_history')
        .select(`
          *,
          admin_institutions (
            name
          )
        `)
        .order('payment_date', { ascending: false })
        .limit(20);

      if (paymentError) throw paymentError;

      setInstitutions(instData || []);
      setPayments(paymentData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activateSubscription = (institution: Institution) => {
    setSelectedInstitution(institution);
    setPaymentForm({
      amount: '5000',
      paymentMethod: 'mpesa',
      transactionId: '',
      referenceNumber: '',
      subscriptionMonths: '12',
      notes: '',
    });
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution || !user) return;

    try {
      const subscriptionMonths = parseInt(paymentForm.subscriptionMonths);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + subscriptionMonths);

      // Record payment
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          institution_id: selectedInstitution.id,
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.paymentMethod,
          transaction_id: paymentForm.transactionId,
          reference_number: paymentForm.referenceNumber,
          subscription_period_months: subscriptionMonths,
          notes: paymentForm.notes,
          recorded_by: user.id,
        });

      if (paymentError) throw paymentError;

      // Update institution subscription
      const { error: updateError } = await supabase
        .from('admin_institutions')
        .update({
          subscription_status: 'paid',
          subscription_expires_at: expiryDate.toISOString(),
          payment_reference: paymentForm.referenceNumber,
        })
        .eq('id', selectedInstitution.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Subscription activated for ${selectedInstitution.name}`,
      });

      setShowPaymentDialog(false);
      setSelectedInstitution(null);
      fetchData();
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to activate subscription",
        variant: "destructive",
      });
    }
  };

  const extendSubscription = async (institution: Institution, months: number) => {
    try {
      let newExpiryDate = new Date();
      
      if (institution.subscription_expires_at) {
        const currentExpiry = new Date(institution.subscription_expires_at);
        if (currentExpiry > new Date()) {
          newExpiryDate = currentExpiry;
        }
      }
      
      newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

      const { error } = await supabase
        .from('admin_institutions')
        .update({
          subscription_status: 'paid',
          subscription_expires_at: newExpiryDate.toISOString(),
        })
        .eq('id', institution.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscription extended by ${months} months for ${institution.name}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast({
        title: "Error",
        description: "Failed to extend subscription",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (institution: Institution) => {
    const now = new Date();
    const expiryDate = institution.subscription_expires_at ? new Date(institution.subscription_expires_at) : null;
    
    if (institution.subscription_status === 'paid' && expiryDate && expiryDate > now) {
      return <Badge className="bg-green-600">Active</Badge>;
    } else if (institution.subscription_status === 'paid' && expiryDate && expiryDate <= now) {
      return <Badge variant="secondary">Expired</Badge>;
    } else {
      return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stats = {
    totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    activeSubscriptions: institutions.filter(inst => {
      const now = new Date();
      const expiryDate = inst.subscription_expires_at ? new Date(inst.subscription_expires_at) : null;
      return inst.subscription_status === 'paid' && expiryDate && expiryDate > now;
    }).length,
    expiredSubscriptions: institutions.filter(inst => {
      const now = new Date();
      const expiryDate = inst.subscription_expires_at ? new Date(inst.subscription_expires_at) : null;
      return inst.subscription_status === 'paid' && expiryDate && expiryDate <= now;
    }).length,
    unpaidInstitutions: institutions.filter(inst => inst.subscription_status === 'unpaid').length,
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
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Control</h1>
        <p className="text-slate-400">Manage institution subscriptions and payment records</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">KSh {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeSubscriptions}</div>
            <p className="text-xs text-slate-400 mt-1">Paid subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Expired</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.expiredSubscriptions}</div>
            <p className="text-xs text-slate-400 mt-1">Need renewal</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Unpaid</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.unpaidInstitutions}</div>
            <p className="text-xs text-slate-400 mt-1">Require payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Institution Subscriptions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Institution Subscriptions</CardTitle>
          <CardDescription className="text-slate-400">
            Manage subscription status and payment records for all institutions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {institutions.map((institution) => {
            const daysUntilExpiry = getDaysUntilExpiry(institution.subscription_expires_at);
            
            return (
              <div key={institution.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-white">{institution.name}</h3>
                    {getStatusBadge(institution)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {institution.subscription_expires_at ? (
                      <>
                        Expires: {new Date(institution.subscription_expires_at).toLocaleDateString()}
                        {daysUntilExpiry !== null && (
                          <span className={`ml-2 ${daysUntilExpiry < 30 ? 'text-yellow-400' : 'text-slate-400'}`}>
                            ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : `Expired ${Math.abs(daysUntilExpiry)} days ago`})
                          </span>
                        )}
                      </>
                    ) : (
                      'No active subscription'
                    )}
                  </div>
                  {institution.payment_reference && (
                    <div className="text-xs text-slate-500">
                      Reference: {institution.payment_reference}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {institution.subscription_status !== 'paid' || (daysUntilExpiry !== null && daysUntilExpiry <= 0) ? (
                    <Button
                      size="sm"
                      onClick={() => activateSubscription(institution)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => extendSubscription(institution, 3)}
                        className="text-blue-400 border-blue-500/50 hover:bg-blue-600/20"
                      >
                        +3 Months
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => extendSubscription(institution, 12)}
                        className="text-green-400 border-green-500/50 hover:bg-green-600/20"
                      >
                        +1 Year
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Payment History
          </CardTitle>
          <CardDescription className="text-slate-400">
            Latest payment transactions and subscription activations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No payment records found</p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-white">{payment.admin_institutions.name}</div>
                    <div className="text-sm text-slate-400">
                      {payment.payment_method.toUpperCase()} • {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                    {payment.transaction_id && (
                      <div className="text-xs text-slate-500">
                        Transaction: {payment.transaction_id}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-400">
                      KSh {Number(payment.amount).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">
                      {payment.subscription_period_months} months
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Record Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Record a new payment and activate subscription for {selectedInstitution?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300">Amount (KSh)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-slate-300">Payment Method</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({...paymentForm, paymentMethod: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionId" className="text-slate-300">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber" className="text-slate-300">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({...paymentForm, referenceNumber: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptionMonths" className="text-slate-300">Subscription Period</Label>
              <Select value={paymentForm.subscriptionMonths} onValueChange={(value) => setPaymentForm({...paymentForm, subscriptionMonths: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Additional notes about this payment..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Record Payment & Activate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionControl;