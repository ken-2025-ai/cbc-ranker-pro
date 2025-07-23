import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Student {
  fullName: string;
  admissionNumber: string;
  class: string;
  stream: string;
  year: string;
}

const StudentRegistration = () => {
  const { toast } = useToast();
  const { institutionId } = useAuth();
  const [student, setStudent] = useState<Student>({
    fullName: "",
    admissionNumber: "",
    class: "",
    stream: "",
    year: new Date().getFullYear().toString()
  });
  const [registrationStats, setRegistrationStats] = useState<any>({
    totalRegistered: 0,
    gradeBreakdown: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (institutionId) {
      fetchRegistrationStats();
    }
  }, [institutionId]);

  const classes = [
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" }
  ];

  const streams = ["A", "B", "C", "D"];
  const currentYear = new Date().getFullYear();
  const years = [currentYear.toString(), (currentYear + 1).toString()];

  const fetchRegistrationStats = async () => {
    try {
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('grade')
        .eq('institution_id', institutionId)
        .eq('year', parseInt(student.year));

      if (error) throw error;

      const gradeBreakdown = studentsData?.reduce((acc: any, student: any) => {
        const grade = `Grade ${student.grade}`;
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {}) || {};

      setRegistrationStats({
        totalRegistered: studentsData?.length || 0,
        gradeBreakdown: Object.entries(gradeBreakdown).map(([grade, count]) => ({
          grade,
          count
        }))
      });
    } catch (error) {
      console.error('Error fetching registration stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student.fullName || !student.admissionNumber || !student.class || !institutionId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if admission number already exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('admission_number')
        .eq('institution_id', institutionId)
        .eq('admission_number', student.admissionNumber)
        .single();

      if (existingStudent) {
        toast({
          title: "Error",
          description: "A student with this admission number already exists",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Insert new student
      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          full_name: student.fullName,
          admission_number: student.admissionNumber,
          grade: student.class,
          stream: student.stream || null,
          year: parseInt(student.year),
          institution_id: institutionId
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Student Registered Successfully",
        description: `${student.fullName} has been added to Grade ${student.class}${student.stream ? ` Stream ${student.stream}` : ''}`,
        variant: "default"
      });

      // Reset form
      setStudent({
        fullName: "",
        admissionNumber: "",
        class: "",
        stream: "",
        year: currentYear.toString()
      });

      // Refresh stats
      fetchRegistrationStats();

    } catch (error: any) {
      console.error('Error registering student:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register student",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    setStudent(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Student Registration</h1>
          <p className="text-muted-foreground">Add new students to your institution's academic record system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-card animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Student Information
                </CardTitle>
                <CardDescription>
                  Enter the student's details to register them in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter student's full name"
                        value={student.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className="transition-smooth focus:shadow-glow"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admissionNumber">Admission Number *</Label>
                      <Input
                        id="admissionNumber"
                        placeholder="e.g., 2024001"
                        value={student.admissionNumber}
                        onChange={(e) => handleInputChange("admissionNumber", e.target.value)}
                        className="transition-smooth focus:shadow-glow"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class *</Label>
                      <Select value={student.class} onValueChange={(value) => handleInputChange("class", value)}>
                        <SelectTrigger className="transition-smooth focus:shadow-glow">
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
                      <Label htmlFor="stream">Stream</Label>
                      <Select value={student.stream} onValueChange={(value) => handleInputChange("stream", value)}>
                        <SelectTrigger className="transition-smooth focus:shadow-glow">
                          <SelectValue placeholder="Select stream (optional)" />
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
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Academic Year</Label>
                      <Select value={student.year} onValueChange={(value) => handleInputChange("year", value)}>
                        <SelectTrigger className="transition-smooth focus:shadow-glow">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" variant="academic" className="flex-1" disabled={loading}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {loading ? 'Registering...' : 'Register Student'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={loading}
                      onClick={() => setStudent({
                        fullName: "", 
                        admissionNumber: "", 
                        class: "", 
                        stream: "", 
                        year: currentYear.toString()
                      })}
                    >
                      Clear Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Registration Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{registrationStats.totalRegistered}</div>
                  <p className="text-sm text-muted-foreground">Students registered this year</p>
                </div>
                
                <div className="space-y-2">
                  {registrationStats.gradeBreakdown.length > 0 ? (
                    registrationStats.gradeBreakdown.map((grade: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm">{grade.grade}</span>
                        <span className="text-sm font-medium">{grade.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">No students registered yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Admission numbers should be unique for each student</p>
                <p>• Stream selection is optional for single-stream classes</p>
                <p>• Students can be registered throughout the term</p>
                <p>• All registered students appear in the marks entry system</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;