import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Users, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClassPerformance {
  className: string;
  averageScore: number;
  studentCount: number;
  topPerformer: string;
}

export const TeacherAnalytics = () => {
  const { staffData, institutionId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassPerformance[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    topClass: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!staffData?.assigned_classes || staffData.assigned_classes.length === 0) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching analytics for assigned classes:', staffData.assigned_classes);

        const classPerformances: ClassPerformance[] = [];

        for (const classId of staffData.assigned_classes) {
          try {
            // Get class info
            const { data: classInfo, error: classError } = await supabase
              .from('classes')
              .select('name, grade, stream')
              .eq('id', classId)
              .single();

            if (classError || !classInfo) {
              console.error('Error fetching class info:', classError);
              continue;
            }

            // Get students in this class
            if (!institutionId) continue;
            
            const { data: studentsData, error: studentsError } = await supabase
              .from('students')
              .select('id, full_name')
              .match({ class_id: classId, institution_id: institutionId });

            if (studentsError || !studentsData || studentsData.length === 0) {
              continue;
            }

            // Get marks for these students
            const studentIds = studentsData.map(s => s.id);
            const { data: marksData, error: marksError } = await supabase
              .from('marks')
              .select('student_id, score')
              .in('student_id', studentIds);

            if (marksError) {
              console.error('Error fetching marks:', marksError);
            }

            // Calculate average score
            const totalScore = marksData?.reduce((sum, mark) => sum + (mark.score || 0), 0) || 0;
            const averageScore = marksData && marksData.length > 0 ? totalScore / marksData.length : 0;

            // Find top performer
            const studentScores = studentsData.map(student => {
              const studentMarks = marksData?.filter(m => m.student_id === student.id) || [];
              const avgScore = studentMarks.length > 0
                ? studentMarks.reduce((sum, m) => sum + (m.score || 0), 0) / studentMarks.length
                : 0;
              return { name: student.full_name, score: avgScore };
            });

            const topPerformer = studentScores.reduce((top, current) => 
              current.score > top.score ? current : top, 
              { name: 'N/A', score: 0 }
            );

            classPerformances.push({
              className: `${classInfo.grade} ${classInfo.stream || ''}`.trim(),
              averageScore: Math.round(averageScore * 10) / 10,
              studentCount: studentsData.length,
              topPerformer: topPerformer.name,
            });
          } catch (err) {
            console.error('Error processing class:', err);
          }
        }

        setClassData(classPerformances);

        // Calculate overall stats
        const totalStudents = classPerformances.reduce((sum, c) => sum + c.studentCount, 0);
        const weightedAvg = classPerformances.reduce((sum, c) => sum + (c.averageScore * c.studentCount), 0);
        const overallAvg = totalStudents > 0 ? weightedAvg / totalStudents : 0;
        const topClass = classPerformances.reduce((top, current) => 
          current.averageScore > top.averageScore ? current : top,
          { className: 'N/A', averageScore: 0, studentCount: 0, topPerformer: 'N/A' }
        );

        setOverallStats({
          totalStudents,
          averageScore: Math.round(overallAvg * 10) / 10,
          topClass: topClass.className,
        });

      } catch (error) {
        console.error('Error fetching teacher analytics:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [staffData, institutionId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!staffData?.assigned_classes || staffData.assigned_classes.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Classes Analytics</CardTitle>
            <CardDescription>No classes assigned yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please contact your administrator to assign classes to your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Classes Analytics</h1>
        <p className="text-muted-foreground">Performance overview for your assigned classes</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all your classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Overall class performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Class</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.topClass}</div>
            <p className="text-xs text-muted-foreground">Best average score</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance Comparison</CardTitle>
          <CardDescription>Average scores across your assigned classes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageScore" fill="hsl(var(--primary))" name="Average Score (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Class Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classData.map((classItem, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{classItem.className}</CardTitle>
              <CardDescription>{classItem.studentCount} students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Score:</span>
                <span className="font-bold text-lg">{classItem.averageScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Performer:</span>
                <span className="font-semibold">{classItem.topPerformer}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
