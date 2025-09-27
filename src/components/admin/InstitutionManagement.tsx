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
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  Search,
  Filter,
  Eye
} from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  username: string;
  headteacher_name: string | null;
  headteacher_phone: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  county: string | null;
  is_active: boolean;
  is_blocked: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  registration_date: string;
  last_login: string | null;
  payment_reference: string | null;
}

const InstitutionManagement = () => {
  const { sessionToken, startImpersonation } = useAdminAuth();
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    headteacher_name: '',
    headteacher_phone: '',
    email: '',
    phone: '',
    address: '',
    county: '',
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch institutions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInstitution) {
        // Update existing institution
        const { error } = await supabase
          .from('admin_institutions')
          .update({
            name: formData.name,
            headteacher_name: formData.headteacher_name,
            headteacher_phone: formData.headteacher_phone,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            county: formData.county,
          })
          .eq('id', editingInstitution.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Institution updated successfully",
        });
      } else {
        // Add new institution
        const { error } = await supabase
          .from('admin_institutions')
          .insert({
            name: formData.name,
            username: formData.username,
            password_hash: 'temp_hash', // Will be hashed by edge function
            headteacher_name: formData.headteacher_name,
            headteacher_phone: formData.headteacher_phone,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            county: formData.county,
          });

        if (error) throw error;

        // If email is provided, automatically create account and send confirmation
        if (formData.email) {
          try {
            console.log('Attempting to create institution account with data:', {
              email: formData.email,
              username: formData.username,
              institutionName: formData.name,
              hasPassword: !!formData.password
            });
            
            const { data, error: signupError } = await supabase.functions.invoke('create-institution-account', {
              body: {
                email: formData.email,
                password: formData.password,
                username: formData.username,
                institutionName: formData.name
              }
            });

            console.log('Create institution account response:', { data, signupError });

            if (signupError) {
              console.warn('Failed to create account for institution:', signupError);
              toast({
                title: "Warning",
                description: "Institution created but failed to send confirmation email. Institution can still sign up manually.",
                variant: "default",
              });
            } else {
              console.log('Institution account created successfully, confirmation email sent');
            }
          } catch (signupErr) {
            console.warn('Signup error (continuing with institution creation):', signupErr);
            toast({
              title: "Warning", 
              description: "Institution created but failed to send confirmation email. Institution can still sign up manually.",
              variant: "default",
            });
          }
        }

        toast({
          title: "Success",
          description: formData.email ? 
            "Institution created successfully! A confirmation email has been sent to the institution." :
            "Institution created successfully",
        });
      }

      setShowAddDialog(false);
      setEditingInstitution(null);
      resetForm();
      fetchInstitutions();
    } catch (error) {
      console.error('Error saving institution:', error);
      toast({
        title: "Error",
        description: "Failed to save institution",
        variant: "destructive",
      });
    }
  };

  const deleteInstitution = async (institution: Institution) => {
    if (!confirm(`Are you sure you want to delete "${institution.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_institutions')
        .delete()
        .eq('id', institution.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Institution deleted successfully",
      });

      // Log the admin activity
      try {
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: sessionToken,
            action_type: 'delete',
            description: `Deleted institution: ${institution.name}`,
            target_type: 'institution',
            target_id: institution.id,
          });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }

      fetchInstitutions();
    } catch (error) {
      console.error('Error deleting institution:', error);
      toast({
        title: "Error",
        description: "Failed to delete institution",
        variant: "destructive",
      });
    }
  };

  const toggleBlockStatus = async (institution: Institution) => {
    try {
      const newBlockedStatus = !institution.is_blocked;
      
      const { error } = await supabase
        .from('admin_institutions')
        .update({ 
          is_blocked: newBlockedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', institution.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Institution ${institution.is_blocked ? 'unblocked' : 'blocked'} successfully. ${newBlockedStatus ? 'Users from this institution are now blocked from accessing their accounts.' : 'Users can now access their accounts again.'}`,
      });

      // Log the admin activity
      try {
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: sessionToken,
            action_type: 'block_toggle',
            description: `${newBlockedStatus ? 'Blocked' : 'Unblocked'} institution: ${institution.name}`,
            target_type: 'institution',
            target_id: institution.id,
          });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }

      fetchInstitutions();
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: "Error",
        description: "Failed to update institution status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      headteacher_name: '',
      headteacher_phone: '',
      email: '',
      phone: '',
      address: '',
      county: '',
    });
  };

  const openEditDialog = (institution: Institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      username: institution.username,
      password: '',
      headteacher_name: institution.headteacher_name || '',
      headteacher_phone: institution.headteacher_phone || '',
      email: institution.email || '',
      phone: institution.phone || '',
      address: institution.address || '',
      county: institution.county || '',
    });
    setShowAddDialog(true);
  };

  // Filter institutions based on search and filter criteria
  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = 
      institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && !institution.is_blocked && institution.subscription_status === 'paid') ||
      (filterStatus === 'blocked' && institution.is_blocked) ||
      (filterStatus === 'expired' && institution.subscription_status === 'expired') ||
      (filterStatus === 'unpaid' && institution.subscription_status === 'unpaid');

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (institution: Institution) => {
    if (institution.is_blocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    
    switch (institution.subscription_status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'unpaid':
        return <Badge variant="outline">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded mb-4"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Institution Management</h1>
          <p className="text-slate-400">Manage all registered institutions and their subscriptions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              resetForm();
              setEditingInstitution(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Institution
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingInstitution ? 'Update institution details' : 'Create a new institution account'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Institution Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    disabled={!!editingInstitution}
                  />
                </div>
                {!editingInstitution && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="headteacher_name" className="text-slate-300">Headteacher Name</Label>
                  <Input
                    id="headteacher_name"
                    value={formData.headteacher_name}
                    onChange={(e) => setFormData({...formData, headteacher_name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headteacher_phone" className="text-slate-300">Headteacher Phone</Label>
                  <Input
                    id="headteacher_phone"
                    value={formData.headteacher_phone}
                    onChange={(e) => setFormData({...formData, headteacher_phone: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county" className="text-slate-300">County</Label>
                  <Input
                    id="county"
                    value={formData.county}
                    onChange={(e) => setFormData({...formData, county: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-300">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingInstitution ? 'Update' : 'Create'} Institution
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search institutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Institutions</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Institutions List */}
      <div className="grid gap-4">
        {filteredInstitutions.map((institution) => (
          <Card key={institution.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{institution.name}</h3>
                    {getStatusBadge(institution)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="h-4 w-4" />
                      <span>{institution.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4" />
                      <span>{institution.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4" />
                      <span>{institution.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(institution.registration_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {institution.headteacher_name && (
                    <div className="mt-2 text-sm text-slate-400">
                      Headteacher: {institution.headteacher_name}
                      {institution.headteacher_phone && ` (${institution.headteacher_phone})`}
                    </div>
                  )}
                  {institution.last_login && (
                    <div className="mt-1 text-xs text-slate-500">
                      Last login: {new Date(institution.last_login).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      startImpersonation(institution);
                    }}
                    className="text-orange-400 border-orange-500/50 hover:bg-orange-600/20"
                    title="Impersonate institution"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(institution)}
                    className="text-blue-400 border-blue-500/50 hover:bg-blue-600/20"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleBlockStatus(institution)}
                    className={institution.is_blocked 
                      ? "text-green-400 border-green-500/50 hover:bg-green-600/20" 
                      : "text-red-400 border-red-500/50 hover:bg-red-600/20"}
                  >
                    {institution.is_blocked ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteInstitution(institution)}
                    className="text-red-400 border-red-500/50 hover:bg-red-600/20"
                    title="Delete institution"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInstitutions.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <p className="text-slate-400">No institutions found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InstitutionManagement;