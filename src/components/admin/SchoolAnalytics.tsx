import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, TrendingDown, Award, Users, BookOpen, 
  GraduationCap, Sparkles, BarChart3, Loader2, Brain
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface SubjectPerformance {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
  studentCount: number;
}

interface ClassPerformance {
  className: string;
  stream: string;
  average: number;
  studentCount: number;
  subjects: SubjectPerformance[];
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  previousAverage: number;
  currentAverage: number;
  improvement: number;
  improvementPercentage: number;
}

interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  assignedClasses: string[];
  averageClassPerformance: number;
  studentCount: number;
  subjectsHandled: string[];
}

const SchoolAnalytics = () => {
  const { toast } = useToast();
  const { institutionId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [subjectData, setSubjectData] = useState<SubjectPerformance[]>([]);
  const [classData, setClassData] = useState<ClassPerformance[]>([]);
  const [topStudents, setTopStudents] = useState<StudentProgress[]>([]);
  const [mostImprovedStudents, setMostImprovedStudents] = useState<StudentProgress[]>([]);
  const [teacherData, setTeacherData] = useState<TeacherPerformance[]>([]);
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [selectedExamPeriod, setSelectedExamPeriod] = useState<string>('');
  const [examPeriods, setExamPeriods] = useState<any[]>([]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  useEffect(() => {
    if (institutionId) {
      fetchExamPeriods();
    }
  }, [institutionId]);

  useEffect(() => {
    if (selectedExamPeriod) {
      fetchAnalyticsData();
    }
  }, [selectedExamPeriod]);

  const fetchExamPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_periods')
        .select('*')
        .eq('institution_id', institutionId)
        .order('year', { ascending: false })
        .order('term', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      setExamPeriods(data || []);
      if (data && data.length > 0) {
        setSelectedExamPeriod(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching exam periods:', error);
      toast({
        title: "Error",
        description: "Failed to load exam periods",
        variant: "destructive",
      });
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all necessary data
      await Promise.all([
        fetchSubjectPerformance(),
        fetchClassPerformance(),
        fetchStudentProgress(),
        fetchTeacherPerformance(),
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectPerformance = async () => {
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('institution_id', institutionId);

    if (!subjects) return;

    const subjectPerformance: SubjectPerformance[] = await Promise.all(
      subjects.map(async (subject) => {
        const { data: marks } = await supabase
          .from('marks')
          .select('score, student_id')
          .eq('subject_id', subject.id)
          .eq('exam_period_id', selectedExamPeriod);

        const markValues = marks?.map(m => Number(m.score)) || [];
        return {
          subject: subject.name,
          average: markValues.length > 0 ? markValues.reduce((a, b) => a + b, 0) / markValues.length : 0,
          highest: markValues.length > 0 ? Math.max(...markValues) : 0,
          lowest: markValues.length > 0 ? Math.min(...markValues) : 0,
          studentCount: new Set(marks?.map(m => m.student_id)).size,
        };
      })
    );

    setSubjectData(subjectPerformance);
  };

  const fetchClassPerformance = async () => {
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('institution_id', institutionId);

    if (!classes) return;

    const classPerformance: ClassPerformance[] = await Promise.all(
      classes.map(async (cls) => {
        const { data: students } = await supabase
          .from('students')
          .select('id')
          .eq('grade', cls.grade)
          .eq('stream', cls.stream || '');

        const studentIds = students?.map(s => s.id) || [];

        const { data: marks } = await supabase
          .from('marks')
          .select('score, subject_id')
          .in('student_id', studentIds)
          .eq('exam_period_id', selectedExamPeriod);

        const markValues = marks?.map(m => Number(m.score)) || [];
        const average = markValues.length > 0 ? markValues.reduce((a, b) => a + b, 0) / markValues.length : 0;

        // Get subject breakdown
        const subjectGroups = marks?.reduce((acc, mark) => {
          const subjectId = mark.subject_id;
          if (!acc[subjectId]) acc[subjectId] = [];
          acc[subjectId].push(Number(mark.score));
          return acc;
        }, {} as Record<string, number[]>) || {};

        const subjects: SubjectPerformance[] = await Promise.all(
          Object.entries(subjectGroups).map(async ([subjectId, values]) => {
            const { data: subject } = await supabase
              .from('subjects')
              .select('name')
              .eq('id', subjectId)
              .single();

            return {
              subject: subject?.name || 'Unknown',
              average: values.reduce((a, b) => a + b, 0) / values.length,
              highest: Math.max(...values),
              lowest: Math.min(...values),
              studentCount: values.length,
            };
          })
        );

        return {
          className: `Grade ${cls.grade}`,
          stream: cls.stream || '',
          average,
          studentCount: studentIds.length,
          subjects,
        };
      })
    );

    setClassData(classPerformance);
  };

  const fetchStudentProgress = async () => {
    // Get current and previous exam periods
    const currentPeriodIndex = examPeriods.findIndex(ep => ep.id === selectedExamPeriod);
    if (currentPeriodIndex === -1 || currentPeriodIndex === examPeriods.length - 1) {
      setMostImprovedStudents([]);
      setTopStudents([]);
      return;
    }

    const previousPeriod = examPeriods[currentPeriodIndex + 1];

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('institution_id', institutionId);

    if (!students) return;

    const studentProgress: StudentProgress[] = await Promise.all(
      students.map(async (student) => {
        const { data: currentMarks } = await supabase
          .from('marks')
          .select('score')
          .eq('student_id', student.id)
          .eq('exam_period_id', selectedExamPeriod);

        const { data: previousMarks } = await supabase
          .from('marks')
          .select('score')
          .eq('student_id', student.id)
          .eq('exam_period_id', previousPeriod.id);

        const currentAvg = currentMarks && currentMarks.length > 0
          ? currentMarks.reduce((sum, m) => sum + Number(m.score), 0) / currentMarks.length
          : 0;

        const previousAvg = previousMarks && previousMarks.length > 0
          ? previousMarks.reduce((sum, m) => sum + Number(m.score), 0) / previousMarks.length
          : 0;

        const improvement = currentAvg - previousAvg;
        const improvementPercentage = previousAvg > 0 ? (improvement / previousAvg) * 100 : 0;

        return {
          studentId: student.id,
          studentName: student.full_name,
          admissionNumber: student.admission_number,
          className: `Grade ${student.grade} ${student.stream || ''}`,
          previousAverage: previousAvg,
          currentAverage: currentAvg,
          improvement,
          improvementPercentage,
        };
      })
    );

    // Filter out students with no data
    const validProgress = studentProgress.filter(sp => sp.currentAverage > 0);

    // Top performing students
    const topPerformers = [...validProgress]
      .sort((a, b) => b.currentAverage - a.currentAverage)
      .slice(0, 10);
    setTopStudents(topPerformers);

    // Most improved students
    const mostImproved = [...validProgress]
      .filter(sp => sp.improvement > 0)
      .sort((a, b) => b.improvementPercentage - a.improvementPercentage)
      .slice(0, 10);
    setMostImprovedStudents(mostImproved);
  };

  const fetchTeacherPerformance = async () => {
    const { data: teachers } = await supabase
      .from('institution_staff')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('role', 'teacher');

    if (!teachers) return;

    const teacherPerformance: TeacherPerformance[] = await Promise.all(
      teachers.map(async (teacher) => {
        const assignedClasses = teacher.assigned_classes || [];
        
        // Get all students from assigned classes
        const classStudents: string[] = [];
        for (const classStr of assignedClasses) {
          const [grade, stream] = classStr.split(' - ');
          const { data: students } = await supabase
            .from('students')
            .select('id')
            .eq('grade', grade.replace('Grade ', ''))
            .eq('stream', stream || '');
          
          if (students) {
            classStudents.push(...students.map(s => s.id));
          }
        }

        // Get marks for these students
        const { data: marks } = await supabase
          .from('marks')
          .select('score, subject_id')
          .in('student_id', classStudents)
          .eq('exam_period_id', selectedExamPeriod);

        const markValues = marks?.map(m => Number(m.score)) || [];
        const average = markValues.length > 0 ? markValues.reduce((a, b) => a + b, 0) / markValues.length : 0;

        // Get unique subjects
        const subjectIds = [...new Set(marks?.map(m => m.subject_id) || [])];
        const { data: subjects } = await supabase
          .from('subjects')
          .select('name')
          .in('id', subjectIds);

        return {
          teacherId: teacher.id,
          teacherName: teacher.full_name,
          assignedClasses,
          averageClassPerformance: average,
          studentCount: new Set(classStudents).size,
          subjectsHandled: subjects?.map(s => s.name) || [],
        };
      })
    );

    setTeacherData(teacherPerformance.filter(t => t.studentCount > 0));
  };

  const getAIInsights = async (type: string, data: any) => {
    setAiInsightsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('analytics-insights', {
        body: { type, data }
      });

      if (error) throw error;

      setAiInsights(prev => ({
        ...prev,
        [type]: result.insights
      }));

      toast({
        title: "AI Insights Generated",
        description: "Analysis complete!",
      });
    } catch (error) {
      console.error('Error getting AI insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive",
      });
    } finally {
      setAiInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bestTeacher = teacherData.length > 0
    ? [...teacherData].sort((a, b) => b.averageClassPerformance - a.averageClassPerformance)[0]
    : null;

  const bestStudentOverall = topStudents.length > 0 ? topStudents[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">School Analytics Dashboard</h1>
          <p className="text-muted-foreground">AI-powered comprehensive performance analysis</p>
        </div>
        <div className="flex gap-4 items-center">
          <select
            value={selectedExamPeriod}
            onChange={(e) => setSelectedExamPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            {examPeriods.map(ep => (
              <option key={ep.id} value={ep.id}>
                {ep.name} - {ep.year} Term {ep.term}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Highlights */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Student of the Year</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {bestStudentOverall ? (
              <>
                <div className="text-2xl font-bold">{bestStudentOverall.studentName}</div>
                <p className="text-xs text-muted-foreground">
                  Average: {bestStudentOverall.currentAverage.toFixed(1)}% | {bestStudentOverall.className}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Best Teacher</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {bestTeacher ? (
              <>
                <div className="text-2xl font-bold">{bestTeacher.teacherName}</div>
                <p className="text-xs text-muted-foreground">
                  Class Avg: {bestTeacher.averageClassPerformance.toFixed(1)}% | {bestTeacher.studentCount} students
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Most Improved</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {mostImprovedStudents.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{mostImprovedStudents[0].studentName}</div>
                <p className="text-xs text-muted-foreground">
                  +{mostImprovedStudents[0].improvement.toFixed(1)}% improvement
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData.length}</div>
            <p className="text-xs text-muted-foreground">
              Avg Performance: {classData.length > 0 
                ? (classData.reduce((sum, c) => sum + c.average, 0) / classData.length).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subject Performance Analysis</CardTitle>
                <CardDescription>Performance metrics across all subjects</CardDescription>
              </div>
              <Button
                onClick={() => getAIInsights('subject_analysis', subjectData)}
                disabled={aiInsightsLoading}
              >
                {aiInsightsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                AI Analysis
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="subject" className="text-xs" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="average" fill="hsl(var(--chart-1))" name="Average" />
                  <Bar dataKey="highest" fill="hsl(var(--chart-2))" name="Highest" />
                  <Bar dataKey="lowest" fill="hsl(var(--chart-3))" name="Lowest" />
                </BarChart>
              </ResponsiveContainer>

              {aiInsights.subject_analysis && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Insights
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{aiInsights.subject_analysis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Class Performance Overview</CardTitle>
                <CardDescription>Performance comparison across all classes</CardDescription>
              </div>
              <Button
                onClick={() => getAIInsights('class_analysis', classData)}
                disabled={aiInsightsLoading}
              >
                {aiInsightsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                AI Analysis
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {classData.map((classInfo, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {classInfo.className} {classInfo.stream}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {classInfo.studentCount} students
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{classInfo.average.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Class Average</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={classInfo.subjects}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="subject" className="text-xs" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))'
                          }}
                        />
                        <Bar dataKey="average" fill={COLORS[idx % COLORS.length]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                ))}
              </div>

              {aiInsights.class_analysis && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Insights
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{aiInsights.class_analysis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Performing Students</CardTitle>
                  <CardDescription>Highest achievers this term</CardDescription>
                </div>
                <Award className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topStudents.map((student, idx) => (
                    <div key={student.studentId} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant={idx === 0 ? "default" : "secondary"}>
                          #{idx + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.admissionNumber} | {student.className}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{student.currentAverage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Most Improved Students</CardTitle>
                  <CardDescription>Greatest progress this term</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mostImprovedStudents.map((student, idx) => (
                    <div key={student.studentId} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant={idx === 0 ? "default" : "secondary"}>
                          #{idx + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.admissionNumber} | {student.className}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600">
                          +{student.improvement.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.previousAverage.toFixed(1)}% → {student.currentAverage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Teacher Performance Analysis</CardTitle>
                <CardDescription>Based on assigned classes' average performance</CardDescription>
              </div>
              <Button
                onClick={() => getAIInsights('teacher_performance', teacherData)}
                disabled={aiInsightsLoading}
              >
                {aiInsightsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                AI Analysis
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherData
                  .sort((a, b) => b.averageClassPerformance - a.averageClassPerformance)
                  .map((teacher, idx) => (
                    <Card key={teacher.teacherId} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {idx === 0 && (
                              <Badge className="bg-yellow-600">
                                <Award className="h-3 w-3 mr-1" />
                                Best Teacher
                              </Badge>
                            )}
                            <h4 className="font-semibold text-lg">{teacher.teacherName}</h4>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <strong>Classes:</strong> {teacher.assignedClasses.join(', ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Students:</strong> {teacher.studentCount}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Subjects:</strong> {teacher.subjectsHandled.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{teacher.averageClassPerformance.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">Average Performance</p>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>

              {aiInsights.teacher_performance && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Insights
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{aiInsights.teacher_performance}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Comprehensive AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Get strategic recommendations and deep analysis of your school's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => getAIInsights('overall_insights', {
                  subjects: subjectData,
                  classes: classData,
                  topStudents,
                  mostImproved: mostImprovedStudents,
                  teachers: teacherData,
                })}
                disabled={aiInsightsLoading}
                className="w-full"
                size="lg"
              >
                {aiInsightsLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Generate Comprehensive AI Analysis
                  </>
                )}
              </Button>

              {aiInsights.overall_insights && (
                <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Strategic Insights & Recommendations
                  </h4>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{aiInsights.overall_insights}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolAnalytics;
