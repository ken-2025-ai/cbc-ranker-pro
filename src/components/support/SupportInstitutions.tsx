import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
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
  Eye,
  Copy,
  CheckCircle,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const SupportInstitutions = () => {
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
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [newInstitutionCode, setNewInstitutionCode] = useState('');

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
        const { error } = await supabase
          .from('admin_institutions')
          .insert({
            name: formData.name,
            username: formData.username,
            password_hash: 'temp_hash',
            headteacher_name: formData.headteacher_name,
            headteacher_phone: formData.headteacher_phone,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            county: formData.county,
          });

        if (error) throw error;

        if (formData.email) {
          try {
            await supabase.functions.invoke('create-institution-account', {
              body: {
                email: formData.email,
                password: formData.password,
                username: formData.username,
                institutionName: formData.name
              }
            });
          } catch (signupErr) {
            console.warn('Signup error:', signupErr);
          }
        }

        setNewInstitutionCode(formData.username);
        setShowCodeDialog(true);
        
        toast({
          title: "Success",
          description: "Institution created successfully!",
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
    if (!confirm(`Are you sure you want to delete "${institution.name}"?`)) {
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
        description: `Institution ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`,
      });

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
        return <Badge className="bg-green-600">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'unpaid':
        return <Badge variant="outline">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institution Management</h1>
          <p className="text-muted-foreground">Manage all registered institutions and their subscriptions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingInstitution(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Institution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
              </DialogTitle>
              <DialogDescription>
                {editingInstitution ? 'Update institution details' : 'Create a new institution account'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Institution Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    disabled={!!editingInstitution}
                  />
                </div>
                {!editingInstitution && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="headteacher_name">Headteacher Name</Label>
                  <Input
                    id="headteacher_name"
                    value={formData.headteacher_name}
                    onChange={(e) => setFormData({...formData, headteacher_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headteacher_phone">Headteacher Phone</Label>
                  <Input
                    id="headteacher_phone"
                    value={formData.headteacher_phone}
                    onChange={(e) => setFormData({...formData, headteacher_phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    value={formData.county}
                    onChange={(e) => setFormData({...formData, county: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingInstitution ? 'Update' : 'Create'} Institution
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Institutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Institutions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredInstitutions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No institutions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInstitutions.map((institution) => (
            <Card key={institution.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{institution.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      {institution.username}
                    </CardDescription>
                  </div>
                  {getStatusBadge(institution)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {institution.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {institution.email}
                  </div>
                )}
                {institution.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {institution.phone}
                  </div>
                )}
                {institution.county && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {institution.county}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(institution.registration_date).toLocaleDateString()}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(institution)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleBlockStatus(institution)}
                  >
                    {institution.is_blocked ? (
                      <><Shield className="w-3 h-3 mr-1" /> Unblock</>
                    ) : (
                      <><ShieldOff className="w-3 h-3 mr-1" /> Block</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteInstitution(institution)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Institution Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Institution Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share this signup code with the institution
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">Institution Signup Code</Label>
              <div className="flex items-center justify-between mt-2">
                <code className="text-2xl font-mono font-bold">{newInstitutionCode}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(newInstitutionCode);
                    toast({ title: "Copied!", description: "Code copied to clipboard" });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The institution can use this code to complete their registration at the signup page.
              {formData.email && " A confirmation email has been sent with the code."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportInstitutions;
