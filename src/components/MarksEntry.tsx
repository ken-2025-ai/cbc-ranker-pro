import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Save, Users, TrendingUp, CalendarIcon, Plus } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewExamForm, setShowNewExamForm] = useState(false);
  const [newExamPeriod, setNewExamPeriod] = useState({
    name: "",
    term: 1,
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined
  });

  const classes = [
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" },
  ];

  const streams = ["A", "B", "C", "D"];

  useEffect(() => {
    if (institutionId) {
      fetchSubjects();
      fetchExamPeriods();
    }
  }, [institutionId]);

  useEffect(() => {
    if (selectedClass && institutionId) {
      fetchStudents();
    }
  }, [selectedClass, selectedStream, institutionId]);

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
    if (!newExamPeriod.name || !newExamPeriod.start_date || !newExamPeriod.end_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all exam period details",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exam_periods')
        .insert({
          name: newExamPeriod.name,
          term: newExamPeriod.term,
          start_date: format(newExamPeriod.start_date, 'yyyy-MM-dd'),
          end_date: format(newExamPeriod.end_date, 'yyyy-MM-dd'),
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
      // Prepare marks data for upsert
      const marksToSave = studentsWithMarks.map(student => ({
        student_id: student.id,
        subject_id: selectedSubject,
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

  const getSubjectLevel = (subjectId: string): 'upper_primary' | 'junior_secondary' => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.level === 'junior_secondary' ? 'junior_secondary' : 'upper_primary';
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
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input
                    placeholder="e.g., End Term 1"
                    value={newExamPeriod.name}
                    onChange={(e) => setNewExamPeriod(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select 
                    value={newExamPeriod.term.toString()} 
                    onValueChange={(value) => setNewExamPeriod(prev => ({ ...prev, term: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
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
                        {newExamPeriod.start_date ? format(newExamPeriod.start_date, "PPP") : "Pick start date"}
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

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newExamPeriod.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newExamPeriod.end_date ? format(newExamPeriod.end_date, "PPP") : "Pick end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newExamPeriod.end_date}
                        onSelect={(date) => setNewExamPeriod(prev => ({ ...prev, end_date: date }))}
                        disabled={(date) => newExamPeriod.start_date ? date < newExamPeriod.start_date : false}
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