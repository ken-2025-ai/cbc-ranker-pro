import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Trash2, Edit, Check, X, Loader2 } from 'lucide-react';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: 'admin' | 'principal' | 'teacher' | 'staff';
  assigned_classes?: string[];
  is_active: boolean;
  created_at: string;
}

interface ClassSelection {
  grade: string;
  stream: string;
  combined: string;
}

const StaffManagement = () => {
  const { toast } = useToast();
  const { institutionId } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<ClassSelection[]>([]);
  const [currentGrade, setCurrentGrade] = useState('');
  const [currentStream, setCurrentStream] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'teacher' as 'admin' | 'principal' | 'teacher' | 'staff',
    password: '',
  });

  const grades = [
    { value: "1", label: "Grade 1" },
    { value: "2", label: "Grade 2" },
    { value: "3", label: "Grade 3" },
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" }
  ];

  useEffect(() => {
    if (institutionId) {
      fetchStaff();
      fetchInstitutionStreams();
    }
  }, [institutionId]);

  const fetchInstitutionStreams = async () => {
    if (!institutionId) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_institutions')
        .select('streams')
        .eq('id', institutionId)
        .single();

      if (error) throw error;

      if (data && data.streams && data.streams.length > 0) {
        setStreams(data.streams);
      } else {
        setStreams(["A", "B", "C", "D"]); // Default streams if none configured
      }
    } catch (error) {
      console.error('Error fetching institution streams:', error);
      setStreams(["A", "B", "C", "D"]); // Fallback to defaults
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('institution_staff' as any)
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff((data as unknown as StaffMember[]) || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.full_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Full name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Valid email is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formData.role === 'teacher' && selectedClasses.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please assign at least one class to the teacher',
        variant: 'destructive',
      });
      return;
    }

    // Prepare assigned classes as array of combined strings
    const assignedClassNames = selectedClasses.map(cls => cls.combined);

    setSubmitting(true);

    try {
      // ACID: Use transaction-like approach - create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email.trim(),
        password: formData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // ACID: Then create staff record - if this fails, we should ideally rollback auth user
      // but Supabase doesn't support cross-schema transactions, so we handle cleanup on error
      const { error: staffError } = await supabase
        .from('institution_staff' as any)
        .insert({
          institution_id: institutionId,
          user_id: authData.user.id,
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone_number: formData.phone_number?.trim() || null,
          role: formData.role,
          assigned_classes: assignedClassNames.length > 0 ? assignedClassNames : null,
          created_by: institutionId,
        });

      if (staffError) {
        // Attempt to cleanup auth user if staff creation failed
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw staffError;
      }

      toast({
        title: 'Success',
        description: 'Staff member added successfully',
      });

      // Reset form
      setDialogOpen(false);
      setFormData({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'teacher',
        password: '',
      });
      setSelectedClasses([]);
      setCurrentGrade('');
      setCurrentStream('');
      
      // Refresh staff list
      await fetchStaff();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add staff member',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addClassSelection = () => {
    if (!currentGrade || !currentStream) {
      toast({
        title: 'Selection Required',
        description: 'Please select both grade and stream',
        variant: 'destructive',
      });
      return;
    }

    const gradeLabel = grades.find(g => g.value === currentGrade)?.label || `Grade ${currentGrade}`;
    const combined = `${gradeLabel} - ${currentStream}`;

    // Check if already selected
    if (selectedClasses.some(cls => cls.combined === combined)) {
      toast({
        title: 'Already Selected',
        description: 'This class is already assigned',
        variant: 'destructive',
      });
      return;
    }

    setSelectedClasses(prev => [...prev, { grade: currentGrade, stream: currentStream, combined }]);
    setCurrentGrade('');
    setCurrentStream('');
  };

  const removeClassSelection = (combined: string) => {
    setSelectedClasses(prev => prev.filter(cls => cls.combined !== combined));
  };

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('institution_staff' as any)
        .update({ is_active: !currentStatus })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Staff member ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchStaff();
    } catch (error: any) {
      console.error('Error updating staff status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update staff status',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-500',
      principal: 'bg-blue-500',
      teacher: 'bg-green-500',
      staff: 'bg-gray-500',
    };
    return <Badge className={colors[role as keyof typeof colors]}>{role.toUpperCase()}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage teachers, principals, and staff members</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleAddStaff}>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Create a new account for a staff member at your institution
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === 'teacher' && (
                  <div className="space-y-3">
                    <Label>Assigned Classes *</Label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="grade">Grade</Label>
                          <Select
                            value={currentGrade}
                            onValueChange={setCurrentGrade}
                          >
                            <SelectTrigger id="grade">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.value} value={grade.value}>
                                  {grade.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stream">Stream</Label>
                          <Select
                            value={currentStream}
                            onValueChange={setCurrentStream}
                            disabled={!currentGrade}
                          >
                            <SelectTrigger id="stream">
                              <SelectValue placeholder="Select stream" />
                            </SelectTrigger>
                            <SelectContent>
                              {streams.map((stream) => (
                                <SelectItem key={stream} value={stream}>
                                  {stream}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addClassSelection}
                        disabled={!currentGrade || !currentStream}
                        className="w-full"
                      >
                        Add Class
                      </Button>
                    </div>
                    
                    {selectedClasses.length > 0 && (
                      <div className="border rounded-md p-3 space-y-2">
                        <Label className="text-xs text-muted-foreground">Selected Classes:</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedClasses.map((cls) => (
                            <Badge
                              key={cls.combined}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {cls.combined}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeClassSelection(cls.combined)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {streams.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No streams configured. Using default streams (A, B, C, D).
                      </p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedClasses([]);
                    setCurrentGrade('');
                    setCurrentStream('');
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Staff'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>View and manage all staff members</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && staff.length === 0 ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Classes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone_number || '-'}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {member.assigned_classes && member.assigned_classes.length > 0
                        ? member.assigned_classes.join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStaffStatus(member.id, member.is_active)}
                      >
                        {member.is_active ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : (
                          <Check className="h-4 w-4 text-success" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;
