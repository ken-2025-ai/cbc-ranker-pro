import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Trophy, Users, Target, Medal, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface StudentRanking {
  id: string;
  name: string;
  admissionNumber: string;
  grade: string;
  stream?: string;
  totalMarks: number;
  averageScore: number;
  subjectCount: number;
  rank: number;
  previousRank?: number;
}

interface StreamRanking {
  stream: string;
  averageScore: number;
  studentCount: number;
  topStudent: string;
}

interface SubjectPerformance {
  subjectName: string;
  classAverage: number;
  streamAverages: { stream: string; average: number }[];
}

const Rankings = () => {
  const { institutionId } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExamPeriod, setSelectedExamPeriod] = useState("");
  const [studentRankings, setStudentRankings] = useState<StudentRanking[]>([]);
  const [streamRankings, setStreamRankings] = useState<StreamRanking[]>([]);
  const [subjectPerformances, setSubjectPerformances] = useState<SubjectPerformance[]>([]);
  const [examPeriods, setExamPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const classes = [
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" },
  ];

  useEffect(() => {
    if (institutionId) {
      fetchExamPeriods();
    }
  }, [institutionId]);

  useEffect(() => {
    if (selectedClass && selectedExamPeriod && institutionId) {
      fetchRankings();
    }
  }, [selectedClass, selectedExamPeriod, institutionId]);

  const fetchExamPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_periods')
        .select('*')
        .eq('institution_id', institutionId)
        .order('name');
      
      if (error) throw error;
      setExamPeriods(data || []);
    } catch (error) {
      console.error('Error fetching exam periods:', error);
    }
  };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      // Fetch students with their marks for the selected class and exam period
      const { data: marksData, error } = await supabase
        .from('marks')
        .select(`
          score,
          student:students!inner(
            id,
            full_name,
            admission_number,
            grade,
            stream,
            institution_id
          ),
          subject:subjects(name),
          exam_period:exam_periods!inner(id)
        `)
        .eq('student.institution_id', institutionId)
        .eq('student.grade', selectedClass)
        .eq('exam_period.id', selectedExamPeriod);

      if (error) throw error;

      // Process student rankings
      const studentMap = new Map<string, any>();
      const subjectMap = new Map<string, any>();

      marksData?.forEach((mark: any) => {
        const studentId = mark.student.id;
        const subjectName = mark.subject?.name || 'Unknown';

        // Track student performance
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: mark.student.full_name,
            admissionNumber: mark.student.admission_number,
            grade: mark.student.grade,
            stream: mark.student.stream,
            scores: [],
            totalMarks: 0
          });
        }
        
        const student = studentMap.get(studentId);
        student.scores.push(mark.score);
        student.totalMarks += mark.score;

        // Track subject performance
        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, {
            subjectName,
            scores: [],
            streamScores: new Map()
          });
        }
        
        const subject = subjectMap.get(subjectName);
        subject.scores.push(mark.score);
        
        const stream = mark.student.stream || 'No Stream';
        if (!subject.streamScores.has(stream)) {
          subject.streamScores.set(stream, []);
        }
        subject.streamScores.get(stream).push(mark.score);
      });

      // Calculate student rankings
      const students = Array.from(studentMap.values()).map((student, index) => ({
        ...student,
        averageScore: student.scores.length > 0 ? student.totalMarks / student.scores.length : 0,
        subjectCount: student.scores.length,
        rank: 0 // Will be calculated after sorting
      }));

      // Sort by average score and assign ranks
      students.sort((a, b) => b.averageScore - a.averageScore);
      students.forEach((student, index) => {
        student.rank = index + 1;
      });

      setStudentRankings(students);

      // Calculate stream rankings
      const streamMap = new Map<string, any>();
      students.forEach(student => {
        const stream = student.stream || 'No Stream';
        if (!streamMap.has(stream)) {
          streamMap.set(stream, {
            stream,
            students: [],
            totalScore: 0
          });
        }
        const streamData = streamMap.get(stream);
        streamData.students.push(student);
        streamData.totalScore += student.averageScore;
      });

      const streams = Array.from(streamMap.values()).map(stream => ({
        stream: stream.stream,
        averageScore: stream.students.length > 0 ? stream.totalScore / stream.students.length : 0,
        studentCount: stream.students.length,
        topStudent: stream.students[0]?.name || 'N/A'
      })).sort((a, b) => b.averageScore - a.averageScore);

      setStreamRankings(streams);

      // Calculate subject performances
      const subjects = Array.from(subjectMap.values()).map(subject => ({
        subjectName: subject.subjectName,
        classAverage: subject.scores.length > 0 ? 
          subject.scores.reduce((sum: number, score: number) => sum + score, 0) / subject.scores.length : 0,
        streamAverages: Array.from(subject.streamScores.entries()).map(([stream, scores]: [string, number[]]) => ({
          stream,
          average: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
        }))
      }));

      setSubjectPerformances(subjects);

    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast({
        title: "Error",
        description: "Failed to load rankings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    if (rank === 3) return "bg-gradient-to-r from-amber-600 to-amber-800 text-white";
    if (rank <= 10) return "bg-gradient-to-r from-blue-500 to-blue-700 text-white";
    return "bg-muted text-muted-foreground";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4" />;
    if (rank === 2) return <Medal className="h-4 w-4" />;
    if (rank === 3) return <Star className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Rankings & Analytics</h1>
          <p className="text-muted-foreground">View class and stream rankings with detailed performance analytics</p>
        </div>

        {/* Selection Panel */}
        <Card className="shadow-card mb-6 animate-slide-up">
          <CardHeader>
            <CardTitle>Selection Panel</CardTitle>
            <CardDescription>Choose the class and exam period to view rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Exam Period</label>
                <Select value={selectedExamPeriod} onValueChange={setSelectedExamPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam period" />
                  </SelectTrigger>
                  <SelectContent>
                    {examPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClass && selectedExamPeriod && (
          <Tabs defaultValue="students" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Student Rankings
              </TabsTrigger>
              <TabsTrigger value="streams" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Stream Analysis
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Subject Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Class Rankings - Grade {selectedClass}
                  </CardTitle>
                  <CardDescription>Students ranked by average performance across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading rankings...</p>
                    </div>
                  ) : studentRankings.length > 0 ? (
                    <div className="space-y-3">
                      {studentRankings.map((student) => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-elevated transition-smooth"
                        >
                          <div className="flex items-center gap-4">
                            <Badge className={`${getRankBadgeColor(student.rank)} min-w-[60px] justify-center`}>
                              <span className="flex items-center gap-1">
                                {getRankIcon(student.rank)}
                                #{student.rank}
                              </span>
                            </Badge>
                            <div>
                              <h4 className="font-semibold text-foreground">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {student.admissionNumber} • Stream {student.stream || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {student.averageScore.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {student.subjectCount} subjects
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No ranking data available for the selected criteria</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="streams" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Stream Rankings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {streamRankings.length > 0 ? (
                      <div className="space-y-4">
                        {streamRankings.map((stream, index) => (
                          <div key={stream.stream} className="p-4 rounded-lg border bg-card">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">Stream {stream.stream}</h4>
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                #{index + 1}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Average Score</p>
                                <p className="font-semibold text-primary">{stream.averageScore.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Students</p>
                                <p className="font-semibold">{stream.studentCount}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-muted-foreground text-xs">Top Performer</p>
                              <p className="font-medium text-sm">{stream.topStudent}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No stream data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Stream Performance Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {streamRankings.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={streamRankings}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="stream" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="averageScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data to display
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Subject Performance Analysis
                  </CardTitle>
                  <CardDescription>Compare performance across different subjects and streams</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjectPerformances.length > 0 ? (
                    <div className="space-y-6">
                      {subjectPerformances.map((subject) => (
                        <div key={subject.subjectName} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg">{subject.subjectName}</h4>
                            <Badge variant="outline" className="text-primary border-primary">
                              Class Avg: {subject.classAverage.toFixed(1)}%
                            </Badge>
                          </div>
                          
                          {subject.streamAverages.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {subject.streamAverages.map((streamAvg) => (
                                <div key={streamAvg.stream} className="text-center p-3 rounded bg-accent/50">
                                  <p className="text-xs text-muted-foreground">Stream {streamAvg.stream}</p>
                                  <p className="font-semibold text-sm">{streamAvg.average.toFixed(1)}%</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No subject performance data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Rankings;