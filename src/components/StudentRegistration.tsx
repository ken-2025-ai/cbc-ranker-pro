import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, GraduationCap } from "lucide-react";

interface Student {
  fullName: string;
  admissionNumber: string;
  class: string;
  stream: string;
  year: string;
  term: string;
}

const StudentRegistration = () => {
  const { toast } = useToast();
  const [student, setStudent] = useState<Student>({
    fullName: "",
    admissionNumber: "",
    class: "",
    stream: "",
    year: "2024",
    term: "3"
  });

  const classes = [
    { value: "grade-4", label: "Grade 4" },
    { value: "grade-5", label: "Grade 5" },
    { value: "grade-6", label: "Grade 6" },
    { value: "grade-7", label: "Grade 7" },
    { value: "grade-8", label: "Grade 8" },
    { value: "grade-9", label: "Grade 9" }
  ];

  const streams = ["A", "B", "C", "D"];
  const terms = ["1", "2", "3"];
  const years = ["2024", "2025"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student.fullName || !student.admissionNumber || !student.class) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically save to your backend
    toast({
      title: "Student Registered Successfully",
      description: `${student.fullName} has been added to ${student.class}${student.stream}`,
      variant: "default"
    });

    // Reset form
    setStudent({
      fullName: "",
      admissionNumber: "",
      class: "",
      stream: "",
      year: "2024",
      term: "3"
    });
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="term">Term</Label>
                      <Select value={student.term} onValueChange={(value) => handleInputChange("term", value)}>
                        <SelectTrigger className="transition-smooth focus:shadow-glow">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((term) => (
                            <SelectItem key={term} value={term}>
                              Term {term}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" variant="academic" className="flex-1">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register Student
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStudent({
                      fullName: "", admissionNumber: "", class: "", stream: "", year: "2024", term: "3"
                    })}>
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
                  <div className="text-3xl font-bold text-primary">247</div>
                  <p className="text-sm text-muted-foreground">Students registered this term</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Grade 4</span>
                    <span className="text-sm font-medium">42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Grade 5</span>
                    <span className="text-sm font-medium">51</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Grade 6</span>
                    <span className="text-sm font-medium">48</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Grade 7</span>
                    <span className="text-sm font-medium">53</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Grade 8</span>
                    <span className="text-sm font-medium">39</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Grade 9</span>
                    <span className="text-sm font-medium">14</span>
                  </div>
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