import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, BookOpen, Award, Loader2, Search, Users, ChevronRight } from 'lucide-react';
import { SubjectAssignmentDialog } from '@/components/staff/SubjectAssignmentDialog';
import { ClassTeacherDialog } from '@/components/staff/ClassTeacherDialog';
import { TeacherWorkloadCard } from '@/components/staff/TeacherWorkloadCard';
import { getTeacherWorkload, getTeacherSubjects, removeSubjectAssignment } from '@/utils/teacherAssignmentUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  assigned_classes?: string[];
  is_active: boolean;
  created_at: string;
}

interface TeacherWithDetails extends Teacher {
  subjects?: any[];
  workload?: any;
  isClassTeacher?: boolean;
}

const MyTeachers = () => {
  const { toast } = useToast();
  const { institutionId } = useAuth();
  const [teachers, setTeachers] = useState<TeacherWithDetails[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string } | null>(null);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [classTeacherDialogOpen, setClassTeacherDialogOpen] = useState(false);
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (institutionId) {
      fetchTeachers();
    }
  }, [institutionId]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredTeachers(
        teachers.filter((teacher) =>
          teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchTerm, teachers]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data: staffData, error } = await supabase
        .from('institution_staff' as any)
        .select('*')
        .eq('institution_id', institutionId)
        .in('role', ['teacher', 'principal'])
        .order('full_name', { ascending: true });

      if (error) throw error;

      const teachersWithDetails: TeacherWithDetails[] = await Promise.all(
        (staffData || []).map(async (teacher: any) => {
          const subjects = await getTeacherSubjects(teacher.user_id, institutionId!);
          const workload = await getTeacherWorkload(teacher.user_id, institutionId!);
          
          // Check if class teacher
          const { data: classTeacherData } = await supabase
            .from('class_teachers' as any)
            .select('*')
            .eq('teacher_id', teacher.user_id)
            .eq('institution_id', institutionId)
            .eq('is_active', true)
            .maybeSingle();

          return {
            ...teacher,
            subjects,
            workload,
            isClassTeacher: !!classTeacherData,
          };
        })
      );

      setTeachers(teachersWithDetails);
      setFilteredTeachers(teachersWithDetails);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubject = (teacherId: string, teacherName: string) => {
    setSelectedTeacher({ id: teacherId, name: teacherName });
    setSubjectDialogOpen(true);
  };

  const handleAssignClassTeacher = (teacherId: string, teacherName: string) => {
    setSelectedTeacher({ id: teacherId, name: teacherName });
    setClassTeacherDialogOpen(true);
  };

  const handleRemoveSubject = async (assignmentId: string) => {
    try {
      await removeSubjectAssignment(assignmentId);
      toast({
        title: 'Success',
        description: 'Subject assignment removed',
      });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove subject assignment',
        variant: 'destructive',
      });
    }
  };

  const toggleExpanded = (teacherId: string) => {
    setExpandedTeacherId(expandedTeacherId === teacherId ? null : teacherId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            My Teachers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage teacher assignments, subjects, and class responsibilities
          </p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{teachers.length}</div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {teachers.filter((t) => t.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Class Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {teachers.filter((t) => t.isClassTeacher).length}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-1 flex items-end">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Teachers List */}
      <div className="grid gap-4">
        {filteredTeachers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No teachers found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search' : 'Add staff members to get started'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Teacher Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{teacher.full_name}</h3>
                      <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {teacher.isClassTeacher && (
                        <Badge className="bg-blue-500">Class Teacher</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{teacher.email}</p>
                      {teacher.phone_number && <p>{teacher.phone_number}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignSubject(teacher.user_id, teacher.full_name)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Assign Subject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignClassTeacher(teacher.user_id, teacher.full_name)}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Class Teacher
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(teacher.id)}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          expandedTeacherId === teacher.id ? 'rotate-90' : ''
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Workload Summary */}
                {teacher.workload && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {teacher.workload.totalSubjects}
                      </div>
                      <div className="text-xs text-muted-foreground">Subjects</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {teacher.workload.totalClasses}
                      </div>
                      <div className="text-xs text-muted-foreground">Classes</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {teacher.workload.totalStreams}
                      </div>
                      <div className="text-xs text-muted-foreground">Streams</div>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {expandedTeacherId === teacher.id && (
                  <div className="mt-6 space-y-4 border-t pt-4">
                    {teacher.workload && (
                      <TeacherWorkloadCard workload={teacher.workload} />
                    )}

                    {teacher.subjects && teacher.subjects.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Assigned Subjects</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {teacher.subjects.map((assignment: any) => (
                            <Card key={assignment.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-semibold">
                                      {assignment.subjects?.name}
                                    </h5>
                                    <p className="text-sm text-muted-foreground">
                                      Grade {assignment.grade} - Stream {assignment.stream}
                                    </p>
                                    {assignment.is_co_teaching && (
                                      <Badge variant="outline" className="mt-2">
                                        Co-Teaching
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSubject(assignment.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!teacher.subjects || teacher.subjects.length === 0) && (
                      <Alert>
                        <AlertDescription>
                          No subjects assigned yet. Click "Assign Subject" to get started.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {selectedTeacher && (
        <>
          <SubjectAssignmentDialog
            open={subjectDialogOpen}
            onOpenChange={setSubjectDialogOpen}
            teacherId={selectedTeacher.id}
            teacherName={selectedTeacher.name}
            institutionId={institutionId!}
            onSuccess={() => {
              setSubjectDialogOpen(false);
              fetchTeachers();
            }}
          />
          <ClassTeacherDialog
            open={classTeacherDialogOpen}
            onOpenChange={setClassTeacherDialogOpen}
            teacherId={selectedTeacher.id}
            teacherName={selectedTeacher.name}
            institutionId={institutionId!}
            onSuccess={() => {
              setClassTeacherDialogOpen(false);
              fetchTeachers();
            }}
          />
        </>
      )}
    </div>
  );
};

export default MyTeachers;
