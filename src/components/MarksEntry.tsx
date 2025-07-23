import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Save, Users, TrendingUp } from "lucide-react";

interface StudentMark {
  id: string;
  name: string;
  admissionNumber: string;
  marks: { [subject: string]: number };
}

const MarksEntry = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  
  // Mock data - in real app this would come from your backend
  const [students, setStudents] = useState<StudentMark[]>([
    { id: "1", name: "John Doe", admissionNumber: "2024001", marks: {} },
    { id: "2", name: "Jane Smith", admissionNumber: "2024002", marks: {} },
    { id: "3", name: "Bob Johnson", admissionNumber: "2024003", marks: {} },
    { id: "4", name: "Alice Brown", admissionNumber: "2024004", marks: {} },
  ]);

  const classes = [
    { value: "grade-6", label: "Grade 6" },
    { value: "grade-7", label: "Grade 7" },
    { value: "grade-8", label: "Grade 8" },
  ];

  const streams = ["A", "B", "C"];

  const subjects = [
    "Mathematics",
    "English",
    "Kiswahili", 
    "Science & Technology",
    "Social Studies",
    "Religious Education",
    "Creative Arts",
    "Physical Education"
  ];

  const getCBCGrade = (score: number, level: 'upper_primary' | 'junior_secondary' = 'upper_primary') => {
    if (score < 0 || score > 100) return "Invalid";
    
    const gradeBands = {
      upper_primary: [
        { min: 0, max: 29, label: "Below Expectation", color: "destructive" },
        { min: 30, max: 45, label: "Approaching Expectation", color: "warning" },
        { min: 46, max: 69, label: "Meeting Expectations", color: "secondary" },
        { min: 70, max: 100, label: "Exceeding Expectations", color: "success" }
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

  const handleSaveMarks = () => {
    if (!selectedClass || !selectedSubject) {
      toast({
        title: "Validation Error",
        description: "Please select class and subject first",
        variant: "destructive"
      });
      return;
    }

    const studentsWithMarks = students.filter(s => selectedSubject in s.marks);
    
    toast({
      title: "Marks Saved Successfully",
      description: `${selectedSubject} marks saved for ${studentsWithMarks.length} students`,
      variant: "default"
    });
  };

  const getClassAverage = () => {
    const marksArray = students
      .map(s => s.marks[selectedSubject])
      .filter(mark => mark !== undefined);
    
    if (marksArray.length === 0) return 0;
    return marksArray.reduce((sum, mark) => sum + mark, 0) / marksArray.length;
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
            <CardDescription>Choose the class, stream, and subject for marks entry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Actions</Label>
                <Button 
                  variant="academic" 
                  className="w-full" 
                  onClick={handleSaveMarks}
                  disabled={!selectedClass || !selectedSubject}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Marks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
        {selectedClass && selectedSubject && (
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {selectedSubject} - {selectedClass.replace('-', ' ')}
                {selectedStream && ` Stream ${selectedStream}`}
              </CardTitle>
              <CardDescription>
                Enter marks for each student (0-100 scale)
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
                          variant={getCBCGrade(student.marks[selectedSubject]).color as any}
                          className="min-w-[140px] text-center"
                        >
                          {getCBCGrade(student.marks[selectedSubject]).label}
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
              <p>3. Enter marks for each student (0-100 scale)</p>
              <p>4. CBC grades will be automatically calculated and displayed</p>
              <p>5. Click "Save Marks" to store the entered data</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;