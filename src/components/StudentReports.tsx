import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download, FileText, TrendingUp, Award, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ReportCard from "./ReportCard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  grade: string;
  stream: string;
}

interface Mark {
  id: string;
  score: number;
  grade?: string;
  remarks?: string;
  subject: {
    id: string;
    name: string;
    code: string;
    level: string;
  };
  exam_period: {
    id: string;
    name: string;
    term: number;
    start_date?: string;
    end_date?: string;
  };
}

interface StudentReportData {
  student: Student;
  marks: Mark[];
  subjectProgress: { subject: string; [key: string]: any }[];
  examComparison: { exam: string; average: number }[];
  overallAverage: number;
  classRank: number;
  streamRank: number;
  totalStudents: number;
  totalStreamStudents: number;
  recommendations: string;
}

const getCBCGrade = (level: string, score: number): string => {
  if (typeof score !== "number" || score < 0 || score > 100) {
    return "Invalid Score";
  }

  const gradeBands = {
    upper_primary: [
      { min: 0, max: 29, label: "Below Expectation" },
      { min: 30, max: 45, label: "Approaching Expectation" },
      { min: 46, max: 69, label: "Meeting Expectations" },
      { min: 70, max: 100, label: "Exceeding Expectations" }
    ],
    junior_secondary: [
      { min: 0, max: 14, label: "Below Expectation 2" },
      { min: 15, max: 29, label: "Below Expectation 1" },
      { min: 30, max: 37, label: "Approaching Expectation 2" },
      { min: 38, max: 45, label: "Approaching Expectation 1" },
      { min: 46, max: 57, label: "Meeting Expectations 2" },
      { min: 58, max: 69, label: "Meeting Expectations 1" },
      { min: 70, max: 79, label: "Exceeding Expectations 2" },
      { min: 80, max: 100, label: "Exceeding Expectations" }
    ]
  };

  const band = gradeBands[level as keyof typeof gradeBands]?.find(b => score >= b.min && score <= b.max);
  return band?.label || "Unknown";
};

const generateAdvice = (marks: Mark[]): string => {
  const weakSubjects = marks.filter(mark => mark.score < 50);
  if (weakSubjects.length === 0) return "Excellent work in all subjects!";
  if (weakSubjects.length === 1) return `Great work overall. Try to improve in ${weakSubjects[0].subject.name}.`;
  return `Focus on improving: ${weakSubjects.map(mark => mark.subject.name).join(", ")}.`;
};

const StudentReports = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [examPeriods, setExamPeriods] = useState<{id: string, name: string}[]>([]);
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showPeriodSelection, setShowPeriodSelection] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const reportCardRef = useRef<HTMLDivElement>(null);
  const { institutionId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (institutionId) {
      fetchStudents();
      fetchExamPeriods();
    }
  }, [institutionId]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, admission_number, grade, stream')
        .eq('institution_id', institutionId)
        .order('grade, stream, full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const fetchExamPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_periods')
        .select('id, name')
        .eq('institution_id', institutionId)
        .order('name');

      if (error) throw error;
      setExamPeriods(data || []);
    } catch (error) {
      console.error('Error fetching exam periods:', error);
      toast({
        title: "Error",
        description: "Failed to load exam periods",
        variant: "destructive",
      });
    }
  };

  // Filter students based on search query first
  const filteredStudents = students.filter(student => 
    !studentSearchQuery || 
    student.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  // Group filtered students by grade and stream for better organization
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const key = `${student.grade}${student.stream || ''}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  const fetchStudentReport = async (studentId: string, periodId?: string) => {
    setLoading(true);
    try {
      // Fetch student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Fetch marks with subject and exam period details
      let marksQuery = supabase
        .from('marks')
        .select(`
          id,
          score,
          grade,
          remarks,
          subject:subjects(id, name, code, level),
          exam_period:exam_periods(id, name, term, start_date, end_date)
        `)
        .eq('student_id', studentId);

      // Filter by exam period if specified
      if (periodId) {
        marksQuery = marksQuery.eq('exam_period_id', periodId);
      }

      const { data: marks, error: marksError } = await marksQuery;

      if (marksError) throw marksError;

      // Calculate actual rankings and student counts
      const { classRank, streamRank, totalStudents, totalStreamStudents } = await calculateStudentRankings(student, marks || []);

      // Process data for charts
      const subjectProgress = processSubjectProgress(marks || []);
      const examComparison = processExamComparison(marks || []);
      const overallAverage = calculateOverallAverage(marks || []);

      setReportData({
        student,
        marks: marks || [],
        subjectProgress,
        examComparison,
        overallAverage,
        classRank,
        streamRank,
        totalStudents,
        totalStreamStudents,
        recommendations: generateAdvice(marks || [])
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Error",
        description: "Failed to load student report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processSubjectProgress = (marks: Mark[]) => {
    const subjectMap = new Map();
    
    marks.forEach(mark => {
      const subjectName = mark.subject.name;
      const examName = mark.exam_period.name;
      
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, { subject: subjectName });
      }
      
      subjectMap.get(subjectName)[examName] = mark.score;
    });
    
    return Array.from(subjectMap.values());
  };

  const processExamComparison = (marks: Mark[]) => {
    const examMap = new Map();
    
    marks.forEach(mark => {
      const examName = mark.exam_period.name;
      if (!examMap.has(examName)) {
        examMap.set(examName, { scores: [], exam: examName });
      }
      examMap.get(examName).scores.push(mark.score);
    });
    
    return Array.from(examMap.values()).map(exam => ({
      exam: exam.exam,
      average: exam.scores.reduce((a: number, b: number) => a + b, 0) / exam.scores.length
    }));
  };

  const calculateOverallAverage = (marks: Mark[]): number => {
    if (marks.length === 0) return 0;
    const total = marks.reduce((sum, mark) => sum + mark.score, 0);
    return total / marks.length;
  };

  const calculateAverageFromScores = (scores: { score: number }[]): number => {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, item) => sum + item.score, 0);
    return total / scores.length;
  };

  const calculateStudentRankings = async (student: Student, marks: Mark[]) => {
    try {
      // Calculate student's overall average
      const studentAverage = calculateOverallAverage(marks);

      // Get all students in the same grade (class)
      const { data: classStudents, error: classError } = await supabase
        .from('students')
        .select('id, full_name, grade, stream')
        .eq('institution_id', institutionId)
        .eq('grade', student.grade);

      if (classError) throw classError;

      // Get all students in the same stream (if stream exists)
      const streamStudents = student.stream 
        ? classStudents?.filter(s => s.stream === student.stream) || []
        : [];

      // Calculate averages for all class students
      const classAverages = await Promise.all(
        (classStudents || []).map(async (classStudent) => {
          const { data: studentMarks } = await supabase
            .from('marks')
            .select('score')
            .eq('student_id', classStudent.id);
          
          const average = calculateAverageFromScores(studentMarks || []);
          return { studentId: classStudent.id, average };
        })
      );

      // Calculate stream averages (if stream exists)
      const streamAverages = student.stream ? await Promise.all(
        streamStudents.map(async (streamStudent) => {
          const { data: studentMarks } = await supabase
            .from('marks')
            .select('score')
            .eq('student_id', streamStudent.id);
          
          const average = calculateAverageFromScores(studentMarks || []);
          return { studentId: streamStudent.id, average };
        })
      ) : [];

      // Sort by average (descending) to get rankings
      const sortedClassAverages = classAverages.sort((a, b) => b.average - a.average);
      const sortedStreamAverages = streamAverages.sort((a, b) => b.average - a.average);

      // Find student's position
      const classRank = sortedClassAverages.findIndex(s => s.studentId === student.id) + 1;
      const streamRank = student.stream 
        ? sortedStreamAverages.findIndex(s => s.studentId === student.id) + 1
        : 0;

      return {
        classRank: classRank || 1,
        streamRank: streamRank || 1,
        totalStudents: classStudents?.length || 1,
        totalStreamStudents: streamStudents.length || 1
      };
    } catch (error) {
      console.error('Error calculating rankings:', error);
      return {
        classRank: 1,
        streamRank: 1,
        totalStudents: 1,
        totalStreamStudents: 1
      };
    }
  };

  const handleDownloadReport = async () => {
    if (!reportData) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first before downloading",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPeriod) {
      setShowPeriodSelection(true);
      return;
    }

    try {
      setLoading(true);
      console.log('Starting PDF generation...', { reportData });
      
      // Show the print view temporarily
      setShowPrintView(true);
      
      // Wait longer for the component to fully render with all styles
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!reportCardRef.current) {
        console.error('Report card ref is null');
        throw new Error('Report card element not found');
      }
      
      console.log('Report card element found:', reportCardRef.current);
      console.log('Element dimensions:', {
        scrollWidth: reportCardRef.current.scrollWidth,
        scrollHeight: reportCardRef.current.scrollHeight,
        clientWidth: reportCardRef.current.clientWidth,
        clientHeight: reportCardRef.current.clientHeight
      });
      
      const canvas = await html2canvas(reportCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: reportCardRef.current.scrollWidth,
        height: reportCardRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true
      });
      
      console.log('Canvas created successfully:', {
        width: canvas.width,
        height: canvas.height
      });
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has invalid dimensions');
      }
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `${reportData.student.full_name.replace(/[^a-zA-Z0-9]/g, '_')}_Report_Card.pdf`;
      console.log('Saving PDF as:', fileName);
      pdf.save(fileName);
      
      toast({
        title: "Download Successful",
        description: "Report card PDF has been downloaded",
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: `Failed to generate PDF: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowPrintView(false);
    }
  };

  return (
    <>
      {/* Print View - Hidden by default */}
      {showPrintView && reportData && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 overflow-auto">
          <ReportCard ref={reportCardRef} data={reportData} />
        </div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Reports</h1>
            <p className="text-muted-foreground">Generate comprehensive student performance reports</p>
          </div>
          <FileText className="h-8 w-8 text-primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Student</CardTitle>
            <CardDescription>Choose a student to generate their performance report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-search">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="student-search"
                  placeholder="Search by name or admission number..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedStudents).map(([classKey, classStudents]) => (
                    <div key={classKey}>
                      <div className="px-2 py-1 text-sm font-semibold text-muted-foreground border-b">
                        Grade {classKey}
                      </div>
                      {classStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.admission_number})
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedStudent && fetchStudentReport(selectedStudent)}
                disabled={!selectedStudent || loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Royal Period Selection Modal */}
        {showPeriodSelection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-2 border-amber-300 dark:border-amber-700 shadow-2xl">
              <CardHeader className="text-center">
                <div className="text-4xl mb-2">👑</div>
                <CardTitle className="text-xl font-bold text-amber-800 dark:text-amber-200">
                  🎓 Your Majesty's Command
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  Before proceeding to download the student's performance report, kindly select the desired academic period from the list below. Only results from the chosen period shall be analyzed and included in the final royal scroll (PDF).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <span>⚠️</span>
                    <em>Note: Failure to choose an academic period will result in a blocked attempt to generate the report.</em>
                  </p>
                </div>
                
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-950">
                    <SelectValue placeholder="🏛️ Choose Academic Period..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-700">
                    {examPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        📚 {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPeriodSelection(false)}
                    className="flex-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedPeriod) {
                        setShowPeriodSelection(false);
                        fetchStudentReport(selectedStudent, selectedPeriod);
                      }
                    }}
                    disabled={!selectedPeriod}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    🏆 Proceed to Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {reportData && (
          <div className="grid gap-6">
            {/* Student Info Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{reportData.student.full_name}</CardTitle>
                    <CardDescription>
                      Grade {reportData.student.grade}{reportData.student.stream} • 
                      Admission No: {reportData.student.admission_number}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      <Award className="w-4 h-4 mr-1" />
                      Avg: {reportData.overallAverage.toFixed(1)}%
                    </Badge>
                    <Button onClick={handleDownloadReport} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Performance Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Subject Progress Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.subjectProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {reportData.examComparison.map((exam, index) => (
                        <Line 
                          key={exam.exam}
                          type="monotone" 
                          dataKey={exam.exam}
                          stroke={`hsl(${index * 60}, 70%, 50%)`}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exam Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.examComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="average" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Subject Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Subject</th>
                        <th className="text-left p-2">Score</th>
                        <th className="text-left p-2">Grade</th>
                        <th className="text-left p-2">CBC Band</th>
                        <th className="text-left p-2">Exam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.marks
                        .sort((a, b) => b.score - a.score) // Sort from highest to lowest score
                        .map((mark, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{mark.subject.name}</td>
                          <td className="p-2">{mark.score}%</td>
                          <td className="p-2">{mark.grade || '-'}</td>
                          <td className="p-2">
                            <Badge variant={mark.score >= 70 ? 'default' : mark.score >= 46 ? 'secondary' : 'destructive'}>
                              {getCBCGrade(mark.subject.level, mark.score)}
                            </Badge>
                          </td>
                          <td className="p-2">{mark.exam_period.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-accent/10 p-4 rounded-lg">
                  <p className="text-foreground">{generateAdvice(reportData.marks)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default StudentReports;