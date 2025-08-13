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

interface ClassReportData {
  className: string;
  students: {
    student: Student;
    marks: Mark[];
    average: number;
    rank: number;
  }[];
  classAverage: number;
  subjectAverages: { subject: string; average: number }[];
  examPeriod?: string;
}

interface StreamReportData {
  streamName: string;
  totalStudents: number;
  streamAverage: number;
  classes: {
    className: string;
    students: {
      student: Student;
      marks: Mark[];
      average: number;
      streamRank: number;
      classRank: number;
    }[];
    classAverage: number;
  }[];
  subjectAverages: { subject: string; average: number }[];
  examPeriod?: string;
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
  
  // Class report states
  const [classReportData, setClassReportData] = useState<ClassReportData | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedClassPeriod, setSelectedClassPeriod] = useState<string>('');
  const [showClassPeriodSelection, setShowClassPeriodSelection] = useState(false);
  const [showClassPrintView, setShowClassPrintView] = useState(false);
  const [loadingClassReport, setLoadingClassReport] = useState(false);
  
  // Stream report states
  const [streamReportData, setStreamReportData] = useState<StreamReportData | null>(null);
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedStreamPeriod, setSelectedStreamPeriod] = useState<string>('');
  const [showStreamPrintView, setShowStreamPrintView] = useState(false);
  const [loadingStreamReport, setLoadingStreamReport] = useState(false);
  
  const reportCardRef = useRef<HTMLDivElement>(null);
  const classReportRef = useRef<HTMLDivElement>(null);
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

  // Get unique classes for class report selection
  const availableClasses = Object.keys(groupedStudents).map(classKey => ({
    key: classKey,
    label: `Grade ${classKey}`,
    students: groupedStudents[classKey]
  }));

  // Get unique streams for stream report selection
  const availableStreams = students.reduce((acc, student) => {
    if (student.stream) {
      const existingStream = acc.find(s => s.key === student.stream);
      if (existingStream) {
        existingStream.totalStudents++;
      } else {
        acc.push({
          key: student.stream,
          label: `Stream ${student.stream}`,
          totalStudents: 1
        });
      }
    }
    return acc;
  }, [] as { key: string; label: string; totalStudents: number }[]);

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
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: reportCardRef.current.scrollWidth,
        height: reportCardRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Apply font styling for better text rendering
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            if (htmlElement.style) {
              htmlElement.style.fontFamily = 'Arial, sans-serif';
              htmlElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
              htmlElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
            }
          });
        }
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

  const fetchClassReport = async (classKey: string, periodId?: string) => {
    setLoadingClassReport(true);
    try {
      // Get all students in the selected class
      const classStudents = groupedStudents[classKey] || [];
      
      if (classStudents.length === 0) {
        throw new Error('No students found in selected class');
      }

      const studentsWithMarks = await Promise.all(
        classStudents.map(async (student) => {
          // Fetch marks for each student
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
            .eq('student_id', student.id);

          if (periodId) {
            marksQuery = marksQuery.eq('exam_period_id', periodId);
          }

          const { data: marks, error } = await marksQuery;
          if (error) throw error;

          const average = calculateOverallAverage(marks || []);
          return {
            student,
            marks: marks || [],
            average,
            rank: 0 // Will be calculated later
          };
        })
      );

      // Sort by average and assign ranks
      studentsWithMarks.sort((a, b) => b.average - a.average);
      studentsWithMarks.forEach((studentData, index) => {
        studentData.rank = index + 1;
      });

      // Calculate class average
      const classAverage = studentsWithMarks.reduce((sum, s) => sum + s.average, 0) / studentsWithMarks.length;

      // Calculate subject averages
      const subjectMap = new Map();
      studentsWithMarks.forEach(studentData => {
        studentData.marks.forEach(mark => {
          const subjectName = mark.subject.name;
          if (!subjectMap.has(subjectName)) {
            subjectMap.set(subjectName, []);
          }
          subjectMap.get(subjectName).push(mark.score);
        });
      });

      const subjectAverages = Array.from(subjectMap.entries()).map(([subject, scores]) => ({
        subject,
        average: scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      })).sort((a, b) => b.average - a.average);

      const selectedPeriodName = periodId 
        ? examPeriods.find(p => p.id === periodId)?.name 
        : 'All Periods';

      setClassReportData({
        className: `Grade ${classKey}`,
        students: studentsWithMarks,
        classAverage,
        subjectAverages,
        examPeriod: selectedPeriodName
      });

    } catch (error) {
      console.error('Error fetching class report:', error);
      toast({
        title: "Error",
        description: "Failed to load class report",
        variant: "destructive",
      });
    } finally {
      setLoadingClassReport(false);
    }
  };

  const handleDownloadClassReport = async () => {
    if (!classReportData) {
      toast({
        title: "No Class Report Data",
        description: "Please generate a class report first",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingClassReport(true);
      console.log('Starting class PDF generation...');
      
      // Show the print view temporarily
      setShowClassPrintView(true);
      
      // Wait for the component to fully render and load all content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!classReportRef.current) {
        throw new Error('Class report element not found');
      }

      console.log('Element dimensions:', {
        scrollWidth: classReportRef.current.scrollWidth,
        scrollHeight: classReportRef.current.scrollHeight,
        offsetWidth: classReportRef.current.offsetWidth,
        offsetHeight: classReportRef.current.offsetHeight
      });

      // Force a reflow to ensure everything is rendered
      classReportRef.current.style.display = 'block';
      classReportRef.current.style.visibility = 'visible';
      
      const canvas = await html2canvas(classReportRef.current, {
        scale: 3, // Balanced scale for performance and quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging
        width: classReportRef.current.scrollWidth,
        height: classReportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        imageTimeout: 30000, // Increased timeout
        onclone: (clonedDoc) => {
          console.log('Cloning document for PDF generation...');
          // Apply high-quality font styling for crisp text
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            if (htmlElement.style) {
              // Use web-safe fonts for better compatibility
              htmlElement.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
              htmlElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
              htmlElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
              htmlElement.style.setProperty('text-rendering', 'optimizeLegibility');
              htmlElement.style.setProperty('font-variant-ligatures', 'none');
              
              // Ensure text is black for PDF
              if (htmlElement.tagName.toLowerCase().includes('text') || 
                  htmlElement.tagName === 'P' || 
                  htmlElement.tagName === 'SPAN' ||
                  htmlElement.tagName === 'DIV') {
                htmlElement.style.color = '#000000';
              }
            }
          });
          
          // Ensure all images are loaded
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            if (!img.complete) {
              console.warn('Image not fully loaded:', img.src);
            }
          });
        }
      });
      
      console.log('Canvas created:', {
        width: canvas.width,
        height: canvas.height,
        dataLength: canvas.toDataURL('image/png', 1.0).length
      });
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has invalid dimensions');
      }
      
      // Generate high-quality PNG for better text clarity
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to generate image data from canvas');
      }
      
      // Create PDF with optimized settings
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: false, // Disable compression for better quality
        precision: 16
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('PDF dimensions:', {
        pdfWidth,
        pdfHeight,
        imgWidth,
        imgHeight,
        aspectRatio: canvas.width / canvas.height
      });
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      const fileName = `${classReportData.className.replace(/[^a-zA-Z0-9]/g, '_')}_Class_Report.pdf`;
      console.log('Saving PDF as:', fileName);
      pdf.save(fileName);
      
      toast({
        title: "Download Successful",
        description: "Class report PDF has been downloaded",
      });
      
    } catch (error) {
      console.error('Error generating class PDF:', error);
      console.error('Stack trace:', error?.stack);
      toast({
        title: "Download Failed",
        description: `Failed to generate PDF: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoadingClassReport(false);
      setShowClassPrintView(false);
    }
  };

  const fetchStreamReport = async (className: string, periodId?: string) => {
    setLoadingStreamReport(true);
    try {
      // Get all students in the selected class (single grade with all streams)
      const classStudents = students.filter(student => student.grade === className);
      
      if (classStudents.length === 0) {
        throw new Error('No students found in selected class');
      }

      // Group students by stream within the class
      const streamGroups = classStudents.reduce((acc, student) => {
        const streamKey = student.stream || 'No Stream';
        if (!acc[streamKey]) {
          acc[streamKey] = [];
        }
        acc[streamKey].push(student);
        return acc;
      }, {} as Record<string, Student[]>);

      // Fetch marks for ALL students first to enable cross-stream ranking
      const allStudentsWithMarks = await Promise.all(
        classStudents.map(async (student) => {
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
            .eq('student_id', student.id);

          if (periodId) {
            marksQuery = marksQuery.eq('exam_period_id', periodId);
          }

          const { data: marks } = await marksQuery;
          const average = calculateOverallAverage(marks || []);
          
          return {
            student,
            marks: marks || [],
            average
          };
        })
      );

      // Sort ALL students by average for overall grade ranking
      allStudentsWithMarks.sort((a, b) => b.average - a.average);
      
      // Add overall grade rankings to each student
      const allStudentsWithGradeRank = allStudentsWithMarks.map((studentData, index) => ({
        ...studentData,
        gradeRank: index + 1
      }));

      // Now group the ranked students by stream
      const streamsData = Object.entries(streamGroups).map(([streamName, streamStudents]) => {
        // Get the student data for this stream
        const streamStudentData = allStudentsWithGradeRank.filter(
          studentData => (studentData.student.stream || 'No Stream') === streamName
        );

        // Sort within stream for stream rankings
        streamStudentData.sort((a, b) => b.average - a.average);
        
        // Add stream rankings
        const studentsWithStreamRank = streamStudentData.map((studentData, index) => ({
          ...studentData,
          streamRank: index + 1,
          classRank: studentData.gradeRank // Use grade rank as class rank
        }));

        const streamAverage = streamStudentData.reduce((sum, s) => sum + s.average, 0) / streamStudentData.length;

        return {
          className: `${className} ${streamName}`,
          students: studentsWithStreamRank,
          classAverage: streamAverage
        };
      });

      // Calculate overall statistics
      const subjectAverages = calculateStreamSubjectAverages(allStudentsWithGradeRank);
      const overallAverage = allStudentsWithGradeRank.reduce((sum, s) => sum + s.average, 0) / allStudentsWithGradeRank.length;

      const examPeriod = periodId 
        ? examPeriods.find(p => p.id === periodId)?.name || 'Selected Period'
        : 'All Periods';

      setStreamReportData({
        streamName: `Grade ${className} - Cross-Stream Rankings`,
        totalStudents: classStudents.length,
        streamAverage: overallAverage,
        classes: streamsData,
        subjectAverages,
        examPeriod
      });

      toast({
        title: "Stream Comparison Report Generated",
        description: `Report generated for ${classStudents.length} students across ${Object.keys(streamGroups).length} streams with cross-stream rankings`,
      });

    } catch (error) {
      console.error('Error fetching stream report:', error);
      toast({
        title: "Error",
        description: "Failed to generate stream report",
        variant: "destructive",
      });
    } finally {
      setLoadingStreamReport(false);
    }
  };

  const calculateStreamSubjectAverages = (students: any[]) => {
    const subjectMap = new Map();
    
    students.forEach(studentData => {
      studentData.marks.forEach((mark: Mark) => {
        const subjectName = mark.subject.name;
        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, { scores: [], subject: subjectName });
        }
        subjectMap.get(subjectName).scores.push(mark.score);
      });
    });
    
    return Array.from(subjectMap.values())
      .map(subject => ({
        subject: subject.subject,
        average: subject.scores.reduce((a: number, b: number) => a + b, 0) / subject.scores.length
      }))
      .sort((a, b) => b.average - a.average);
  };

  const handleDownloadStreamReport = async () => {
    if (!streamReportData) {
      toast({
        title: "No Report Data",
        description: "Please generate a stream report first before downloading",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingStreamReport(true);
      console.log('Starting stream PDF generation...');
      
      setShowStreamPrintView(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!streamReportRef.current) {
        throw new Error('Stream report element not found');
      }

      const canvas = await html2canvas(streamReportRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true,
        width: streamReportRef.current.scrollWidth,
        height: streamReportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        imageTimeout: 30000,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            if (htmlElement.style) {
              htmlElement.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
              htmlElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
              htmlElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
              htmlElement.style.setProperty('text-rendering', 'optimizeLegibility');
              
              if (htmlElement.tagName.toLowerCase().includes('text') || 
                  htmlElement.tagName === 'P' || 
                  htmlElement.tagName === 'SPAN' ||
                  htmlElement.tagName === 'DIV') {
                htmlElement.style.color = '#000000';
              }
            }
          });
        }
      });
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has invalid dimensions');
      }
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: false,
        precision: 16
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      const fileName = `${streamReportData.streamName.replace(/[^a-zA-Z0-9]/g, '_')}_Stream_Report.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Download Successful",
        description: "Stream report PDF has been downloaded",
      });
      
    } catch (error) {
      console.error('Error generating stream PDF:', error);
      toast({
        title: "Download Failed",
        description: `Failed to generate PDF: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoadingStreamReport(false);
      setShowStreamPrintView(false);
    }
  };

  const streamReportRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Print View - Hidden by default */}
      {showPrintView && reportData && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 overflow-auto">
          <ReportCard ref={reportCardRef} data={reportData} />
        </div>
      )}
      
      {/* Class Print View - Hidden by default */}
      {showClassPrintView && classReportData && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 overflow-auto">
          <div ref={classReportRef} className="p-8 bg-white min-h-screen">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{classReportData.className} Performance Report</h1>
              <p className="text-lg text-gray-600">Academic Period: {classReportData.examPeriod}</p>
              <p className="text-sm text-gray-500">Class Average: {classReportData.classAverage.toFixed(1)}%</p>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Student Rankings</h2>
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Rank</th>
                    <th className="border p-2 text-left">Student Name</th>
                    <th className="border p-2 text-left">Admission No.</th>
                    <th className="border p-2 text-left">Average (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {classReportData.students.map((studentData, index) => (
                    <tr key={studentData.student.id}>
                      <td className="border p-2">{studentData.rank}</td>
                      <td className="border p-2">{studentData.student.full_name}</td>
                      <td className="border p-2">{studentData.student.admission_number}</td>
                      <td className="border p-2">{studentData.average.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Subject Performance Summary</h2>
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Subject</th>
                    <th className="border p-2 text-left">Class Average (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {classReportData.subjectAverages.map((subject) => (
                    <tr key={subject.subject}>
                      <td className="border p-2">{subject.subject}</td>
                      <td className="border p-2">{subject.average.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stream Print View - Hidden by default */}
      {showStreamPrintView && streamReportData && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 overflow-auto">
          <div ref={streamReportRef} className="p-8 bg-white min-h-screen">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{streamReportData.streamName} Performance Report</h1>
              <p className="text-lg text-gray-600">Academic Period: {streamReportData.examPeriod}</p>
              <p className="text-sm text-gray-500">
                Stream Average: {streamReportData.streamAverage.toFixed(1)}% • 
                Total Students: {streamReportData.totalStudents}
              </p>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Stream Rankings</h2>
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Stream Rank</th>
                    <th className="border p-2 text-left">Class Rank</th>
                    <th className="border p-2 text-left">Student Name</th>
                    <th className="border p-2 text-left">Class</th>
                    <th className="border p-2 text-left">Admission No.</th>
                    <th className="border p-2 text-left">Average (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {streamReportData.classes.flatMap(classData =>
                    classData.students.map((studentData) => (
                      <tr key={studentData.student.id}>
                        <td className="border p-2 font-bold">{studentData.streamRank}</td>
                        <td className="border p-2">{studentData.classRank}</td>
                        <td className="border p-2">{studentData.student.full_name}</td>
                        <td className="border p-2">{classData.className}</td>
                        <td className="border p-2">{studentData.student.admission_number}</td>
                        <td className="border p-2">{studentData.average.toFixed(1)}%</td>
                      </tr>
                    ))
                  ).sort((a, b) => parseInt(a.props.children[0].props.children) - parseInt(b.props.children[0].props.children))}
                </tbody>
              </table>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Class Performance Summary</h2>
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Class</th>
                    <th className="border p-2 text-left">Students</th>
                    <th className="border p-2 text-left">Class Average (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {streamReportData.classes.map((classData) => (
                    <tr key={classData.className}>
                      <td className="border p-2">{classData.className}</td>
                      <td className="border p-2">{classData.students.length}</td>
                      <td className="border p-2">{classData.classAverage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Subject Performance Summary</h2>
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Subject</th>
                    <th className="border p-2 text-left">Stream Average (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {streamReportData.subjectAverages.map((subject) => (
                    <tr key={subject.subject}>
                      <td className="border p-2">{subject.subject}</td>
                      <td className="border p-2">{subject.average.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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

        {/* Class Report Section */}
        <Card>
          <CardHeader>
            <CardTitle>Class Report</CardTitle>
            <CardDescription>Generate a comprehensive report for an entire class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((classOption) => (
                    <SelectItem key={classOption.key} value={classOption.key}>
                      {classOption.label} ({classOption.students.length} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedClassPeriod} onValueChange={setSelectedClassPeriod}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select exam period..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {examPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedClass && fetchClassReport(selectedClass, selectedClassPeriod === 'all' ? undefined : selectedClassPeriod)}
                disabled={!selectedClass || loadingClassReport}
              >
                {loadingClassReport ? 'Generating...' : 'Generate Class Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stream Report Section */}
        <Card>
          <CardHeader>
            <CardTitle>Entire Stream Report</CardTitle>
            <CardDescription>Generate a comprehensive report for all students across all classes in a stream</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a stream..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStreams.map((streamOption) => (
                    <SelectItem key={streamOption.key} value={streamOption.key}>
                      {streamOption.label} ({streamOption.totalStudents} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStreamPeriod} onValueChange={setSelectedStreamPeriod}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select exam period..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {examPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedStream && fetchStreamReport(selectedStream, selectedStreamPeriod === 'all' ? undefined : selectedStreamPeriod)}
                disabled={!selectedStream || loadingStreamReport}
              >
                {loadingStreamReport ? 'Generating...' : 'Generate Stream Report'}
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

        {/* Class Report Results */}
        {classReportData && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{classReportData.className} Performance Report</CardTitle>
                    <CardDescription>
                      Academic Period: {classReportData.examPeriod} • 
                      Class Average: {classReportData.classAverage.toFixed(1)}%
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownloadClassReport} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Class PDF
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Student Rankings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Student Rankings</CardTitle>
                <CardDescription>Students ranked by overall performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">Student Name</th>
                        <th className="text-left p-2">Admission No.</th>
                        <th className="text-left p-2">Average (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classReportData.students.map((studentData) => (
                        <tr key={studentData.student.id} className="border-b">
                          <td className="p-2 font-bold">{studentData.rank}</td>
                          <td className="p-2">{studentData.student.full_name}</td>
                          <td className="p-2">{studentData.student.admission_number}</td>
                          <td className="p-2">
                            <Badge variant={studentData.average >= 70 ? 'default' : studentData.average >= 50 ? 'secondary' : 'destructive'}>
                              {studentData.average.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Subject Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Summary</CardTitle>
                <CardDescription>Class averages by subject (highest to lowest)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Subject</th>
                        <th className="text-left p-2">Class Average (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classReportData.subjectAverages.map((subject) => (
                        <tr key={subject.subject} className="border-b">
                          <td className="p-2 font-medium">{subject.subject}</td>
                          <td className="p-2">
                            <Badge variant={subject.average >= 70 ? 'default' : subject.average >= 50 ? 'secondary' : 'destructive'}>
                              {subject.average.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stream Report Results */}
        {streamReportData && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{streamReportData.streamName} Performance Report</CardTitle>
                    <CardDescription>
                      Academic Period: {streamReportData.examPeriod} • 
                      Stream Average: {streamReportData.streamAverage.toFixed(1)}% • 
                      Total Students: {streamReportData.totalStudents}
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownloadStreamReport} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Stream PDF
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Stream Rankings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Stream Rankings</CardTitle>
                <CardDescription>All students ranked by stream-wide performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Stream Rank</th>
                        <th className="text-left p-2">Class Rank</th>
                        <th className="text-left p-2">Student Name</th>
                        <th className="text-left p-2">Class</th>
                        <th className="text-left p-2">Average (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streamReportData.classes
                        .flatMap(classData => 
                          classData.students.map(studentData => ({
                            ...studentData,
                            className: classData.className
                          }))
                        )
                        .sort((a, b) => a.streamRank - b.streamRank)
                        .map((studentData) => (
                          <tr key={studentData.student.id} className="border-b">
                            <td className="p-2 font-bold">{studentData.streamRank}</td>
                            <td className="p-2">{studentData.classRank}</td>
                            <td className="p-2">{studentData.student.full_name}</td>
                            <td className="p-2">{studentData.className}</td>
                            <td className="p-2">
                              <Badge variant={studentData.average >= 70 ? 'default' : studentData.average >= 50 ? 'secondary' : 'destructive'}>
                                {studentData.average.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Class Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Class Performance Summary</CardTitle>
                <CardDescription>Performance overview by class within the stream</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Class</th>
                        <th className="text-left p-2">Students</th>
                        <th className="text-left p-2">Class Average (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streamReportData.classes.map((classData) => (
                        <tr key={classData.className} className="border-b">
                          <td className="p-2 font-medium">{classData.className}</td>
                          <td className="p-2">{classData.students.length}</td>
                          <td className="p-2">
                            <Badge variant={classData.classAverage >= 70 ? 'default' : classData.classAverage >= 50 ? 'secondary' : 'destructive'}>
                              {classData.classAverage.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Subject Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Summary</CardTitle>
                <CardDescription>Stream averages by subject (highest to lowest)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Subject</th>
                        <th className="text-left p-2">Stream Average (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streamReportData.subjectAverages.map((subject) => (
                        <tr key={subject.subject} className="border-b">
                          <td className="p-2 font-medium">{subject.subject}</td>
                          <td className="p-2">
                            <Badge variant={subject.average >= 70 ? 'default' : subject.average >= 50 ? 'secondary' : 'destructive'}>
                              {subject.average.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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