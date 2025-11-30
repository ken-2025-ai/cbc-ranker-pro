import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, BookOpen, TrendingUp, Award, Loader2, GraduationCap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClassInfo {
  grade: string;
  stream: string;
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  year: number;
}

interface SubjectTeacher {
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  teacher_email: string;
  is_co_teaching: boolean;
}

interface ClassAnalytics {
  totalStudents: number;
  averagePerformance: number;
  topPerformer?: {
    name: string;
    average: number;
  };
  subjectPerformance: Array<{
    subject: string;
    average: number;
  }>;
}

const MyClass = () => {
  const { toast } = useToast();
  const { institutionId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacher[]>([]);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);

  useEffect(() => {
    if (institutionId) {
      fetchClassInfo();
    }
  }, [institutionId]);

  useEffect(() => {
    if (classInfo) {
      fetchStudents();
      fetchSubjectTeachers();
      fetchAnalytics();
    }
  }, [classInfo]);

  const fetchClassInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('class_teachers' as any)
        .select('grade, stream')
        .eq('teacher_id', user.id)
        .eq('institution_id', institutionId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data || typeof data === 'string') {
        toast({
          title: 'Not a Class Teacher',
          description: 'You are not assigned as a class teacher',
          variant: 'destructive',
        });
        return;
      }

      setClassInfo(data);
    } catch (error: any) {
      console.error('Error fetching class info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load class information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!classInfo) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, admission_number, year')
        .eq('institution_id', institutionId)
        .eq('grade', classInfo.grade)
        .eq('stream', classInfo.stream)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchSubjectTeachers = async () => {
    if (!classInfo) return;

    try {
      const { data, error } = await supabase
        .from('teacher_subjects' as any)
        .select(`
          is_co_teaching,
          subjects:subject_id (
            name,
            code
          ),
          teacher:teacher_id (
            full_name,
            email
          )
        `)
        .eq('institution_id', institutionId)
        .eq('grade', classInfo.grade)
        .eq('stream', classInfo.stream);

      if (error) throw error;

      const teachers: SubjectTeacher[] = (data || []).map((item: any) => ({
        subject_name: item.subjects?.name || 'Unknown',
        subject_code: item.subjects?.code || '',
        teacher_name: item.teacher?.full_name || 'Unknown',
        teacher_email: item.teacher?.email || '',
        is_co_teaching: item.is_co_teaching,
      }));

      setSubjectTeachers(teachers);
    } catch (error: any) {
      console.error('Error fetching subject teachers:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!classInfo) return;

    try {
      // Get active exam period
      const { data: examPeriod } = await supabase
        .from('exam_periods')
        .select('id')
        .eq('institution_id', institutionId)
        .eq('is_active', true)
        .maybeSingle();

      if (!examPeriod) {
        setAnalytics({
          totalStudents: students.length,
          averagePerformance: 0,
          subjectPerformance: [],
        });
        return;
      }

      // Get marks for this class
      const { data: marksData, error } = await supabase
        .from('marks_active' as any)
        .select(`
          score,
          student_id,
          subject_id,
          subjects:subject_id (
            name
          )
        `)
        .eq('exam_period_id', examPeriod.id)
        .in(
          'student_id',
          students.map((s) => s.id)
        );

      if (error) throw error;

      // Type guard for marks data
      const marks = Array.isArray(marksData) ? marksData : [];

      // Calculate analytics
      const totalMarks = marks.reduce((sum, mark: any) => sum + (mark.score || 0), 0);
      const averagePerformance = marks.length > 0 
        ? totalMarks / marks.length 
        : 0;

      // Subject performance
      const subjectMap = new Map<string, { total: number; count: number }>();
      marks.forEach((mark: any) => {
        const subjectName = mark.subjects?.name || 'Unknown';
        const existing = subjectMap.get(subjectName) || { total: 0, count: 0 };
        subjectMap.set(subjectName, {
          total: existing.total + (mark.score || 0),
          count: existing.count + 1,
        });
      });

      const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        average: data.total / data.count,
      }));

      // Top performer
      const studentScores = new Map<string, { total: number; count: number; name: string }>();
      for (const mark of marks) {
        const student = students.find((s) => s.id === (mark as any).student_id);
        if (student) {
          const existing = studentScores.get((mark as any).student_id) || {
            total: 0,
            count: 0,
            name: student.full_name,
          };
          studentScores.set((mark as any).student_id, {
            total: existing.total + ((mark as any).score || 0),
            count: existing.count + 1,
            name: student.full_name,
          });
        }
      }

      let topPerformer = undefined;
      let maxAverage = 0;
      studentScores.forEach((data) => {
        const average = data.total / data.count;
        if (average > maxAverage) {
          maxAverage = average;
          topPerformer = { name: data.name, average };
        }
      });

      setAnalytics({
        totalStudents: students.length,
        averagePerformance,
        topPerformer,
        subjectPerformance,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            You are not assigned as a class teacher. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            Grade {classInfo.grade} - Stream {classInfo.stream}
          </h1>
          <p className="text-muted-foreground">Class Teacher Dashboard</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {analytics?.totalStudents || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Class Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics?.averagePerformance.toFixed(1) || '0.0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {subjectTeachers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate">
              {analytics?.topPerformer?.name || 'N/A'}
            </div>
            {analytics?.topPerformer && (
              <div className="text-xs text-muted-foreground">
                {analytics.topPerformer.average.toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Subject Teachers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Students</CardTitle>
              <CardDescription>
                All students in Grade {classInfo.grade} - Stream {classInfo.stream}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <Alert>
                  <AlertDescription>No students enrolled in this class yet.</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <Card key={student.id}>
                      <CardContent className="pt-6">
                        <h3 className="font-semibold mb-2">{student.full_name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Adm: {student.admission_number}</p>
                          <p>Year: {student.year}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Teachers</CardTitle>
              <CardDescription>
                Teachers assigned to this class for each subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subjectTeachers.length === 0 ? (
                <Alert>
                  <AlertDescription>No subject teachers assigned yet.</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjectTeachers.map((teacher, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{teacher.subject_name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {teacher.subject_code}
                            </p>
                          </div>
                          {teacher.is_co_teaching && (
                            <Badge variant="outline">Co-Teaching</Badge>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="font-medium text-sm">{teacher.teacher_name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.teacher_email}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>
                Average performance by subject for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics || analytics.subjectPerformance.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No performance data available yet. Marks need to be entered for the current exam period.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {analytics.subjectPerformance.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{subject.subject}</span>
                        <span className="text-sm font-bold text-primary">
                          {subject.average.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(subject.average, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyClass;
