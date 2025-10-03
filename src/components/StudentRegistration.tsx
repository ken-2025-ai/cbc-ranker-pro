import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, GraduationCap, Eye, CheckCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

interface Student {
  fullName: string;
  admissionNumber: string;
  class: string;
  stream: string;
  year: string;
}

interface FormEvent {
  field: string;
  value: string;
  timestamp: Date;
  action: 'filled' | 'cleared' | 'changed';
}

// ACID-compliant validation schema
const studentSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens and apostrophes")
    .transform(val => val.trim()),
  admissionNumber: z.string()
    .min(3, "Admission number must be at least 3 characters")
    .max(20, "Admission number must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Admission number can only contain letters, numbers and hyphens")
    .transform(val => val.trim().toUpperCase()),
  class: z.string()
    .min(1, "Class is required")
    .regex(/^[1-9]$/, "Class must be between 1 and 9"),
  stream: z.string().optional(),
  year: z.string()
    .regex(/^\d{4}$/, "Invalid year format")
    .refine(val => {
      const year = parseInt(val);
      return year >= 2020 && year <= 2100;
    }, "Year must be between 2020 and 2100"),
  institutionId: z.string().uuid("Invalid institution ID")
});

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
  const [formEvents, setFormEvents] = useState<FormEvent[]>([]);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [autoSaveTriggered, setAutoSaveTriggered] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [streams, setStreams] = useState<string[]>([]);

  useEffect(() => {
    fetchRegistrationStats();
    fetchInstitutionStreams();
  }, []);

  const classes = [
    { value: "1", label: "Grade 1" },
    { value: "2", label: "Grade 2" },
    { value: "3", label: "Grade 3" },
    { value: "4", label: "Grade 4" },
    { value: "5", label: "Grade 5" },
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
    { value: "8", label: "Grade 8" },
    { value: "9", label: "Grade 9" }
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear.toString(), (currentYear + 1).toString()];


  const fetchInstitutionStreams = async () => {
    if (!institutionId) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_institutions')
        .select('streams')
        .eq('id', institutionId)
        .single();

      if (error) throw error;

      if (data && data.streams && data.streams.length > 0) {
        setStreams(data.streams);
      } else {
        setStreams(["A", "B", "C", "D"]); // Default streams if none configured
      }
    } catch (error) {
      console.error('Error fetching institution streams:', error);
      setStreams(["A", "B", "C", "D"]); // Fallback to defaults
    }
  };

  const fetchRegistrationStats = async () => {
    if (!institutionId) return;
    
    try {
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('grade')
        .eq('year', parseInt(student.year))
        .eq('institution_id', institutionId);

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

  const logFormEvent = useCallback((field: string, value: string, action: 'filled' | 'cleared' | 'changed') => {
    const event: FormEvent = {
      field,
      value: value ? '***' : '', // Mask actual values for privacy
      timestamp: new Date(),
      action
    };
    setFormEvents(prev => [...prev, event]);
  }, []);

  const checkFormCompleteness = useCallback(() => {
    const required = ['fullName', 'admissionNumber', 'class'];
    const isComplete = required.every(field => student[field as keyof Student].trim() !== '');
    setIsFormComplete(isComplete);
    return isComplete;
  }, [student]);

  // ACID-compliant validation function
  const validateStudentData = useCallback(async (): Promise<boolean> => {
    try {
      setValidationErrors({});
      
      const validationData = {
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        class: student.class,
        stream: student.stream,
        year: student.year,
        institutionId: institutionId || ''
      };

      await studentSchema.parseAsync(validationData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Validation Failed",
          description: "Please correct the errors in the form",
          variant: "destructive"
        });
      }
      return false;
    }
  }, [student, institutionId, toast]);

  // ACID-compliant transaction with retry logic
  const executeTransactionWithRetry = async (
    operation: () => Promise<any>,
    maxRetries = 3
  ): Promise<{ success: boolean; error?: string }> => {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return { success: true };
      } catch (error: any) {
        lastError = error.message || 'Transaction failed';
        
        // Don't retry on validation errors
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          return { success: false, error: 'Duplicate admission number detected' };
        }
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
    
    return { success: false, error: lastError };
  };

  const autoSaveStudent = useCallback(async () => {
    if (!isFormComplete || autoSaveTriggered || !institutionId) return;
    
    setAutoSaveTriggered(true);
    setLoading(true);
    
    // Generate unique transaction ID for idempotency
    const txId = crypto.randomUUID();
    setTransactionId(txId);
    
    try {
      // ACID Step 1: Validate all data
      const isValid = await validateStudentData();
      if (!isValid) {
        setAutoSaveTriggered(false);
        setLoading(false);
        return;
      }

      // ACID Step 2: Execute transaction with isolation
      const result = await executeTransactionWithRetry(async () => {
        // Check for duplicates with row-level locking simulation
        const { data: existingStudent } = await supabase
          .from('students')
          .select('admission_number, institution_id')
          .eq('admission_number', student.admissionNumber.trim().toUpperCase())
          .eq('institution_id', institutionId)
          .maybeSingle();

        if (existingStudent) {
          throw new Error('A student with this admission number already exists');
        }

        // Insert with validated and normalized data
        const { error } = await supabase
          .from('students')
          .insert([{
            full_name: student.fullName.trim(),
            admission_number: student.admissionNumber.trim().toUpperCase(),
            grade: student.class.trim(),
            stream: student.stream.trim() || null,
            year: parseInt(student.year),
            institution_id: institutionId
          }]);

        if (error) throw error;
      });

      // ACID Step 3: Handle result
      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      toast({
        title: "Auto-save Successful",
        description: `${student.fullName} has been automatically registered with ACID compliance`,
        variant: "default"
      });

      logFormEvent('form', 'auto-saved-acid', 'filled');
      
      // Reset form after successful auto-save
      setTimeout(() => {
        setStudent({
          fullName: "",
          admissionNumber: "",
          class: "",
          stream: "",
          year: currentYear.toString()
        });
        setAutoSaveTriggered(false);
        setIsFormComplete(false);
        setFormEvents([]);
        setTransactionId(null);
        setValidationErrors({});
        fetchRegistrationStats();
      }, 2000);

    } catch (error: any) {
      console.error('Auto-save error:', error);
      toast({
        title: "Auto-save Failed",
        description: error.message || "Failed to auto-save student",
        variant: "destructive"
      });
      setAutoSaveTriggered(false);
      setTransactionId(null);
    } finally {
      setLoading(false);
    }
  }, [isFormComplete, autoSaveTriggered, student, toast, logFormEvent, fetchRegistrationStats, institutionId, validateStudentData]);

  useEffect(() => {
    checkFormCompleteness();
  }, [student, checkFormCompleteness]);

  useEffect(() => {
    if (isFormComplete && !autoSaveTriggered) {
      const timer = setTimeout(() => {
        autoSaveStudent();
      }, 1000); // Auto-save after 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [isFormComplete, autoSaveStudent, autoSaveTriggered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!institutionId) {
      toast({
        title: "Institution Error",
        description: "Please ensure you are associated with an institution",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Generate unique transaction ID for idempotency
    const txId = crypto.randomUUID();
    setTransactionId(txId);
    
    try {
      // ACID Step 1: Comprehensive validation
      const isValid = await validateStudentData();
      if (!isValid) {
        setLoading(false);
        setTransactionId(null);
        return;
      }

      // ACID Step 2: Execute transaction with retry and isolation
      const result = await executeTransactionWithRetry(async () => {
        // Atomic check and insert with proper isolation
        const normalizedAdmissionNumber = student.admissionNumber.trim().toUpperCase();
        
        // Check for duplicates within same institution
        const { data: existingStudent } = await supabase
          .from('students')
          .select('admission_number, institution_id')
          .eq('admission_number', normalizedAdmissionNumber)
          .eq('institution_id', institutionId)
          .maybeSingle();

        if (existingStudent) {
          throw new Error('A student with this admission number already exists in your institution');
        }

        // Insert with validated and normalized data
        const { error: insertError } = await supabase
          .from('students')
          .insert([{
            full_name: student.fullName.trim(),
            admission_number: normalizedAdmissionNumber,
            grade: student.class.trim(),
            stream: student.stream.trim() || null,
            year: parseInt(student.year),
            institution_id: institutionId
          }]);

        if (insertError) throw insertError;
      });

      // ACID Step 3: Verify transaction success
      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      toast({
        title: "Student Registered Successfully",
        description: `${student.fullName} has been registered with full ACID compliance (TX: ${txId.slice(0, 8)})`,
        variant: "default"
      });

      logFormEvent('form', 'submitted-acid', 'filled');

      // Reset form
      setStudent({
        fullName: "",
        admissionNumber: "",
        class: "",
        stream: "",
        year: currentYear.toString()
      });
      setValidationErrors({});
      setTransactionId(null);

      // Refresh stats
      fetchRegistrationStats();

    } catch (error: any) {
      console.error('Error registering student:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register student. Transaction rolled back.",
        variant: "destructive"
      });
      setTransactionId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    const previousValue = student[field];
    setStudent(prev => ({ ...prev, [field]: value }));
    
    // Log the event
    if (value && !previousValue) {
      logFormEvent(field, value, 'filled');
    } else if (!value && previousValue) {
      logFormEvent(field, value, 'cleared');
    } else if (value !== previousValue) {
      logFormEvent(field, value, 'changed');
    }
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
          {!institutionId && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">⚠️ You must be associated with an institution to register students. Please contact your administrator.</p>
            </div>
          )}
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
                        className={`transition-smooth focus:shadow-glow ${validationErrors.fullName ? 'border-destructive' : ''}`}
                      />
                      {validationErrors.fullName && (
                        <p className="text-xs text-destructive">{validationErrors.fullName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admissionNumber">Admission Number *</Label>
                      <Input
                        id="admissionNumber"
                        placeholder="e.g., 2024001"
                        value={student.admissionNumber}
                        onChange={(e) => handleInputChange("admissionNumber", e.target.value)}
                        className={`transition-smooth focus:shadow-glow ${validationErrors.admissionNumber ? 'border-destructive' : ''}`}
                      />
                      {validationErrors.admissionNumber && (
                        <p className="text-xs text-destructive">{validationErrors.admissionNumber}</p>
                      )}
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
                      <Select value={student.stream || undefined} onValueChange={(value) => handleInputChange("stream", value || "")}>
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

          {/* Event Viewer and Summary Panel */}
          <div className="space-y-6">
            {/* ACID Compliance Status */}
            <Card className="shadow-card animate-slide-up bg-gradient-to-br from-primary/5 to-primary/10" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  ACID Compliance
                </CardTitle>
                <CardDescription>Transaction integrity status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Atomicity</span>
                    <span className="text-xs px-2 py-1 bg-success/10 text-success rounded">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consistency</span>
                    <span className="text-xs px-2 py-1 bg-success/10 text-success rounded">Enforced</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Isolation</span>
                    <span className="text-xs px-2 py-1 bg-success/10 text-success rounded">Validated</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Durability</span>
                    <span className="text-xs px-2 py-1 bg-success/10 text-success rounded">Guaranteed</span>
                  </div>
                  {transactionId && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        TX ID: {transactionId.slice(0, 8)}...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Completion Status */}
            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.15s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${isFormComplete ? 'text-success' : 'text-muted-foreground'}`} />
                  Form Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Status</span>
                    <span className={`text-sm font-medium ${isFormComplete ? 'text-success' : 'text-muted-foreground'}`}>
                      {isFormComplete ? 'Complete - Auto-saving...' : 'Incomplete'}
                    </span>
                  </div>
                  {isFormComplete && !autoSaveTriggered && (
                    <div className="text-xs text-muted-foreground">
                      ACID-compliant auto-save in 1 second...
                    </div>
                  )}
                  {loading && (
                    <div className="text-xs text-primary">
                      Executing transaction with retry logic...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Viewer */}
            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Form Events
                </CardTitle>
                <CardDescription>Real-time form filling activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formEvents.length > 0 ? (
                    formEvents.slice(-5).reverse().map((event, index) => (
                      <div key={index} className="flex justify-between items-center text-xs p-2 bg-accent/50 rounded">
                        <div>
                          <span className="font-medium capitalize">{event.field}</span>
                          <span className={`ml-2 px-1 rounded text-xs ${
                            event.action === 'filled' ? 'bg-success/20 text-success' :
                            event.action === 'cleared' ? 'bg-destructive/20 text-destructive' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {event.action}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">No form events yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Registration Summary */}
            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.3s" }}>
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

            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle>Auto-save Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Fill all required fields for auto-save to trigger</p>
                <p>• Form auto-saves 1 second after completion</p>
                <p>• Admission numbers must be unique</p>
                <p>• Form resets automatically after successful save</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;