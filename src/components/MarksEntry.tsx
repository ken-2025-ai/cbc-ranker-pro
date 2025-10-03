import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Save, Users, TrendingUp, CalendarIcon, Plus, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface StudentMark {
  id: string;
  name: string;
  admissionNumber: string;
  marks: { [subject: string]: number };
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  grade: string;
  stream: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  level: string;
}

interface ExamPeriod {
  id: string;
  name: string;
  term: number;
  start_date?: string;
  end_date?: string;
}

// CBC Subjects - Standard across all schools
const CBC_SUBJECTS = {
  'upper_primary': [
    { id: 'eng_up', name: 'English', code: 'ENG' },
    { id: 'kis_up', name: 'Kiswahili', code: 'KIS' },
    { id: 'mat_up', name: 'Mathematics', code: 'MATH' },
    { id: 'sci_up', name: 'Science and Technology', code: 'SCI' },
    { id: 'sst_up', name: 'Social Studies', code: 'SST' },
    { id: 'cre_up', name: 'Christian Religious Education', code: 'CRE' },
    { id: 'hms_up', name: 'Home Science', code: 'HMS' },
    { id: 'agr_up', name: 'Agriculture', code: 'AGR' },
    { id: 'cra_up', name: 'Creative Arts', code: 'CRA' },
    { id: 'phe_up', name: 'Physical and Health Education', code: 'PHE' },
  ],
  'junior_secondary': [
    { id: 'eng_js', name: 'English', code: 'ENG' },
    { id: 'kis_js', name: 'Kiswahili', code: 'KIS' },
    { id: 'mat_js', name: 'Mathematics', code: 'MAT' },
    { id: 'isc_js', name: 'Integrated Science', code: 'ISC' },
    { id: 'sst_js', name: 'Social Studies', code: 'SST' },
    { id: 'cre_js', name: 'Christian Religious Education', code: 'CRE' },
    { id: 'hms_js', name: 'Home Science', code: 'HMS' },
    { id: 'agr_js', name: 'Agriculture', code: 'AGR' },
    { id: 'cas_js', name: 'Creative Arts & Sports', code: 'CAS' },
    { id: 'bst_js', name: 'Business Studies', code: 'BST' },
    { id: 'csc_js', name: 'Computer Science', code: 'CSC' },
    { id: 'phe_js', name: 'Physical and Health Education', code: 'PHE' },
  ]
};

const MarksEntry = () => {
  const { toast } = useToast();
  const { institutionId } = useAuth();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamPeriod, setSelectedExamPeriod] = useState("");
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [streams, setStreams] = useState<string[]>(["A", "B", "C", "D"]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewExamForm, setShowNewExamForm] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [newExamPeriod, setNewExamPeriod] = useState({
    name: "",
    term: 1,
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined
  });
  
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  const classes = [
    { value: "1", label: "Grade 1" },
    { value: "2", label: "Grade 2" },
    { value: "3", label: "Grade 3" },
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" },
  ];

  // Fetch initial data when institutionId is available
  useEffect(() => {
    if (institutionId) {
      fetchSubjects();
      fetchExamPeriods();
    }
  }, [institutionId]);

  // Always refetch streams on mount to ensure they're up-to-date
  useEffect(() => {
    if (institutionId) {
      fetchInstitutionStreams();
    }
  }, []);

  useEffect(() => {
    if (selectedClass && institutionId) {
      fetchStudents();
    }
  }, [selectedClass, selectedStream, institutionId]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchInstitutionStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_institutions')
        .select('streams')
        .eq('id', institutionId)
        .single();
      
      if (error) throw error;
      
      if (data?.streams && Array.isArray(data.streams) && data.streams.length > 0) {
        setStreams(data.streams);
      } else {
        setStreams(["A", "B", "C", "D"]);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      setStreams(["A", "B", "C", "D"]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

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

  const handleCreateExamPeriod = async () => {
    if (!newExamPeriod.name || !newExamPeriod.start_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in exam name and date",
        variant: "destructive"
      });
      return;
    }

    if (!institutionId) {
      toast({
        title: "Error",
        description: "Institution not found. Please ensure you're associated with an institution.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exam_periods')
        .insert({
          name: newExamPeriod.name,
          term: 1, // Default term
          start_date: format(newExamPeriod.start_date, 'yyyy-MM-dd'),
          end_date: format(newExamPeriod.start_date, 'yyyy-MM-dd'), // Same as start date
          institution_id: institutionId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exam period created successfully",
      });

      // Reset form and refresh list
      setNewExamPeriod({
        name: "",
        term: 1,
        start_date: undefined,
        end_date: undefined
      });
      setShowNewExamForm(false);
      fetchExamPeriods();
      
      // Auto-select the new exam period
      if (data) {
        setSelectedExamPeriod(data.id);
      }
    } catch (error: any) {
      console.error('Error creating exam period:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exam period",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('grade', selectedClass)
        .order('full_name');

      if (selectedStream && selectedStream !== "all") {
        query = query.eq('stream', selectedStream);
      }

      const { data: studentsData, error } = await query;
      if (error) throw error;

      // Fetch existing marks for these students
      const studentIds = studentsData?.map(s => s.id) || [];
      let marksData: any[] = [];
      
      if (studentIds.length > 0 && selectedSubject && selectedExamPeriod) {
        const { data: marks, error: marksError } = await supabase
          .from('marks')
          .select('student_id, score')
          .in('student_id', studentIds)
          .eq('subject_id', selectedSubject)
          .eq('exam_period_id', selectedExamPeriod);
        
        if (!marksError) {
          marksData = marks || [];
        }
      }

      // Transform data for the component
      const transformedStudents = studentsData?.map(student => {
        const existingMark = marksData.find(mark => mark.student_id === student.id);
        return {
          id: student.id,
          name: student.full_name,
          admissionNumber: student.admission_number,
          marks: selectedSubject && existingMark ? { [selectedSubject]: existingMark.score } : {}
        };
      }) || [];

      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCBCGrade = (score: number, level: 'upper_primary' | 'junior_secondary' = 'upper_primary') => {
    if (score < 0 || score > 100) return { label: "Invalid", color: "destructive" };
    
    const gradeBands = {
      upper_primary: [
        { min: 0, max: 29, label: "Below Expectation", color: "destructive" },
        { min: 30, max: 45, label: "Approaching Expectation", color: "warning" },
        { min: 46, max: 69, label: "Meeting Expectations", color: "secondary" },
        { min: 70, max: 100, label: "Exceeding Expectations", color: "success" }
      ],
      junior_secondary: [
        { min: 0, max: 14, label: "Below Expectation 2", color: "destructive" },
        { min: 15, max: 29, label: "Below Expectation 1", color: "destructive" },
        { min: 30, max: 37, label: "Approaching Expectation 2", color: "warning" },
        { min: 38, max: 45, label: "Approaching Expectation 1", color: "warning" },
        { min: 46, max: 57, label: "Meeting Expectations 2", color: "secondary" },
        { min: 58, max: 69, label: "Meeting Expectations 1", color: "secondary" },
        { min: 70, max: 79, label: "Exceeding Expectations 2", color: "success" },
        { min: 80, max: 100, label: "Exceeding Expectations", color: "success" }
      ]
    };
    
    const band = gradeBands[level].find(b => score >= b.min && score <= b.max);
    return band || { label: "Invalid", color: "destructive" };
  };

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    
    setStudents(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, marks: { ...student.marks, [selectedSubject]: numValue } }
          : student
      )
    );
  };

  const handleSaveMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedExamPeriod) {
      toast({
        title: "Validation Error",
        description: "Please select class, subject, and exam period first",
        variant: "destructive"
      });
      return;
    }

    const studentsWithMarks = students.filter(s => selectedSubject in s.marks && s.marks[selectedSubject] !== undefined);
    
    if (studentsWithMarks.length === 0) {
      toast({
        title: "No Marks to Save",
        description: "Please enter marks for at least one student",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Check if user has an institution
      if (!institutionId) {
        toast({
          title: "Institution Required",
          description: "You must be associated with an institution to save marks.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Check if selectedSubject is already a valid UUID from database subjects
      let subjectId = selectedSubject;
      
      // If it's one of the CBC subject codes, find the corresponding subject in database
      if (selectedSubject && !selectedSubject.includes('-')) {
        const selectedSubjectInfo = getAvailableSubjects().find(s => s.id === selectedSubject);
        if (selectedSubjectInfo) {
          const { data: dbSubject, error: subjectError } = await supabase
            .from('subjects')
            .select('id')
            .eq('code', selectedSubjectInfo.code)
            .eq('institution_id', institutionId)
            .single();
          
          if (subjectError || !dbSubject) {
            // Try to create the subject if it doesn't exist
            const subjectLevel = getSubjectLevel(selectedSubject);
            const { data: newSubject, error: createError } = await supabase
              .from('subjects')
              .insert({
                name: selectedSubjectInfo.name,
                code: selectedSubjectInfo.code,
                level: subjectLevel,
                institution_id: institutionId
              })
              .select('id')
              .single();
            
            if (createError || !newSubject) {
              toast({
                title: "Subject Creation Failed",
                description: `Could not create subject "${selectedSubjectInfo.name}". Please add it manually first.`,
                variant: "destructive"
              });
              setSaving(false);
              return;
            }
            
            subjectId = newSubject.id;
            toast({
              title: "Subject Created",
              description: `"${selectedSubjectInfo.name}" has been added to your institution.`,
            });
          } else {
            subjectId = dbSubject.id;
          }
        }
      }

      // Prepare marks data for upsert
      const marksToSave = studentsWithMarks.map(student => ({
        student_id: student.id,
        subject_id: subjectId,
        exam_period_id: selectedExamPeriod,
        score: student.marks[selectedSubject],
        grade: null, // Will be calculated by the system if needed
        remarks: null
      }));

      const { error } = await supabase
        .from('marks')
        .upsert(marksToSave, { 
          onConflict: 'student_id,subject_id,exam_period_id'
        });

      if (error) throw error;

      toast({
        title: "Marks Saved Successfully",
        description: `Marks saved for ${studentsWithMarks.length} students`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error saving marks:', error);
      toast({
        title: "Error Saving Marks",
        description: error.message || "Failed to save marks",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getClassAverage = () => {
    const marksArray = students
      .map(s => s.marks[selectedSubject])
      .filter(mark => mark !== undefined);
    
    if (marksArray.length === 0) return 0;
    return marksArray.reduce((sum, mark) => sum + mark, 0) / marksArray.length;
  };

  // Get available subjects based on selected class
  const getAvailableSubjects = () => {
    if (!selectedClass) return [];
    
    const classNum = parseInt(selectedClass);
    if (classNum >= 4 && classNum <= 6) {
      return CBC_SUBJECTS.upper_primary;
    } else if (classNum >= 7 && classNum <= 9) {
      return CBC_SUBJECTS.junior_secondary;
    }
    return [];
  };

  const getSubjectLevel = (subjectId: string): 'upper_primary' | 'junior_secondary' => {
    const classNum = parseInt(selectedClass);
    return (classNum >= 7 && classNum <= 9) ? 'junior_secondary' : 'upper_primary';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Marks Entry</h1>
          <p className="text-muted-foreground">Enter subject marks for students in your selected class</p>
        </div>

        {/* Class and Subject Selection */}
        <Card className="shadow-card mb-6 animate-slide-up">
          <CardHeader>
            <CardTitle>Selection Panel</CardTitle>
            <CardDescription>Choose the class, stream, subject, and exam period for marks entry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
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
                <Label>Stream</Label>
                <Select value={selectedStream} onValueChange={setSelectedStream}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    {streams.map((stream) => (
                      <SelectItem key={stream} value={stream}>
                        Stream {stream}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="relative" ref={subjectDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !selectedSubject && "text-muted-foreground"
                    )}
                  >
                    {selectedSubject 
                      ? getAvailableSubjects().find(s => s.id === selectedSubject)?.name || "Select subject"
                      : "Select subject"
                    }
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isSubjectDropdownOpen && "rotate-180"
                      )} 
                    />
                  </Button>
                  
                  {isSubjectDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                      <ul className="py-1 max-h-60 overflow-auto">
                         {getAvailableSubjects().map((subject) => (
                           <li key={subject.id}>
                             <button
                               type="button"
                               onClick={() => {
                                 setSelectedSubject(subject.id);
                                 setIsSubjectDropdownOpen(false);
                               }}
                               className={cn(
                                 "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-150 flex items-center justify-between",
                                 selectedSubject === subject.id && "bg-accent text-accent-foreground"
                               )}
                             >
                               <span>{subject.name}</span>
                               {selectedSubject === subject.id && (
                                 <Check className="h-4 w-4 text-primary" />
                               )}
                             </button>
                           </li>
                         ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Exam Period</Label>
                <div className="flex gap-2">
                  <Select value={selectedExamPeriod} onValueChange={setSelectedExamPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {examPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                          {period.start_date && period.end_date && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({format(new Date(period.start_date), 'MMM d')} - {format(new Date(period.end_date), 'MMM d')})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewExamForm(!showNewExamForm)}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Actions</Label>
                <Button 
                  variant="academic" 
                  className="w-full" 
                  onClick={handleSaveMarks}
                  disabled={!selectedClass || !selectedSubject || !selectedExamPeriod || saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Marks'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Exam Period Form */}
        {showNewExamForm && (
          <Card className="shadow-card mb-6 animate-slide-up">
            <CardHeader>
              <CardTitle>Create New Exam Period</CardTitle>
              <CardDescription>Add a new exam period with start and end dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input
                    placeholder="e.g., End Term 1"
                    value={newExamPeriod.name}
                    onChange={(e) => setNewExamPeriod(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newExamPeriod.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newExamPeriod.start_date ? format(newExamPeriod.start_date, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newExamPeriod.start_date}
                        onSelect={(date) => setNewExamPeriod(prev => ({ ...prev, start_date: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateExamPeriod} className="flex-1">
                  Create Exam Period
                </Button>
                <Button variant="outline" onClick={() => setShowNewExamForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Panel */}
        {selectedSubject && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{students.length}</div>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-success">{getClassAverage().toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Class Average</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 text-warning mx-auto mb-2" />
                <div className="text-2xl font-bold text-warning">
                  {students.filter(s => selectedSubject in s.marks).length}
                </div>
                <p className="text-sm text-muted-foreground">Marks Entered</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Marks Entry Table */}
        {selectedClass && selectedSubject && selectedExamPeriod && (
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {subjects.find(s => s.id === selectedSubject)?.name} - Grade {selectedClass}
                {selectedStream && ` Stream ${selectedStream}`}
              </CardTitle>
              <CardDescription>
                Enter marks for each student (0-100 scale) {loading && '- Loading students...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student, index) => (
                  <div 
                    key={student.id} 
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-smooth"
                    style={{ animationDelay: `${(index + 5) * 0.1}s` }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Admission: {student.admissionNumber}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="0-100"
                        min="0"
                        max="100"
                        value={student.marks[selectedSubject] || ""}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        className="w-20 text-center transition-smooth focus:shadow-glow"
                      />
                      
                      {student.marks[selectedSubject] !== undefined && (
                        <Badge 
                          variant={getCBCGrade(student.marks[selectedSubject], getSubjectLevel(selectedSubject)).color as any}
                          className="min-w-[140px] text-center"
                        >
                          {getCBCGrade(student.marks[selectedSubject], getSubjectLevel(selectedSubject)).label}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        {!selectedClass && (
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>1. Select the class and stream you want to enter marks for</p>
              <p>2. Choose the subject from the dropdown menu</p>
              <p>3. Select the exam period (term and assessment type)</p>
              <p>4. Enter marks for each student (0-100 scale)</p>
              <p>5. CBC grades will be automatically calculated and displayed</p>
              <p>6. Click "Save Marks" to store the entered data in the database</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;