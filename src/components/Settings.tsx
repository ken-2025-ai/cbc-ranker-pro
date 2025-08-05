import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  GraduationCap, 
  School, 
  Shield, 
  UserMinus, 
  HelpCircle, 
  Mail, 
  Phone,
  Plus,
  Trash2,
  AlertTriangle
} from "lucide-react";

const Settings = () => {
  const [curriculumLevel, setCurriculumLevel] = useState("upper-primary");
  const [schoolName, setSchoolName] = useState("Your School Name");
  const [streams] = useState(["8A", "8B", "8C", "7A", "7B"]);

  const upperPrimaryGrades = [
    { grade: "Below Expectation", range: "0-29", color: "destructive" },
    { grade: "Approaching Expectation", range: "30-45", color: "warning" },
    { grade: "Meeting Expectation", range: "46-69", color: "academic" },
    { grade: "Exceeding Expectation", range: "70-100", color: "success" }
  ];

  const juniorSecondaryGrades = [
    { grade: "Below Expectation 2", range: "0-14", color: "destructive" },
    { grade: "Below Expectation 1", range: "15-29", color: "destructive" },
    { grade: "Approaching Expectation 2", range: "30-37", color: "warning" },
    { grade: "Approaching Expectation 1", range: "38-45", color: "warning" },
    { grade: "Meeting Expectation 2", range: "46-57", color: "academic" },
    { grade: "Meeting Expectation 1", range: "58-69", color: "academic" },
    { grade: "Exceeding Expectation 2", range: "70-79", color: "success" },
    { grade: "Exceeding Expectation", range: "80-100", color: "success" }
  ];

  const currentGrades = curriculumLevel === "upper-primary" ? upperPrimaryGrades : juniorSecondaryGrades;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <SettingsIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              CBC Settings
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Configure your institution's grading system, manage academic data, and customize your CBC experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grading System Controls */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Grading System Controls</CardTitle>
                  <CardDescription>Configure curriculum level and grade boundaries</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="curriculum-level" className="text-base font-medium">Curriculum Level</Label>
                <Select value={curriculumLevel} onValueChange={setCurriculumLevel}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select curriculum level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upper-primary">Upper Primary</SelectItem>
                    <SelectItem value="junior-secondary">Junior Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <h4 className="text-lg font-semibold mb-4 text-primary">
                  {curriculumLevel === "upper-primary" ? "Upper Primary" : "Junior Secondary"} Grade Boundaries
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentGrades.map((grade, index) => (
                    <Card key={index} className="border-2 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <Badge variant={grade.color as any} className="mb-2 w-full justify-center py-1">
                          {grade.range}
                        </Badge>
                        <p className="text-sm font-medium text-foreground">{grade.grade}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institution Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <School className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Institution Controls</CardTitle>
                  <CardDescription>Manage school information and streams</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="school-name" className="text-base font-medium">School Name</Label>
                <Input
                  id="school-name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary">Stream Management</h4>
                
                <div className="space-y-3">
                  <Label className="text-base font-medium">Existing Streams</Label>
                  <div className="flex flex-wrap gap-2">
                    {streams.map((stream, index) => (
                      <div key={index} className="flex items-center gap-1 bg-secondary rounded-lg px-3 py-1">
                        <span className="text-sm font-medium">{stream}</span>
                        <Button variant="ghost" size="sm" className="h-auto p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input placeholder="Enter new stream (e.g., 8D)" className="flex-1" />
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Stream
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account & Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Account & Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary">Change Password</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="old-password">Current Password</Label>
                    <Input id="old-password" type="password" placeholder="Enter current password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" placeholder="Enter new password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Security Note:</strong> Ensure your password is secure and contains at least 8 characters.
                    </p>
                  </div>
                  
                  <Button className="w-full">Update Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Removal Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <UserMinus className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl">Student Management</CardTitle>
                  <CardDescription>Remove students from the system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-search">Select Student</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Search by name or admission number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student1">John Doe - ADM001</SelectItem>
                      <SelectItem value="student2">Jane Smith - ADM002</SelectItem>
                      <SelectItem value="student3">Mike Johnson - ADM003</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <h5 className="font-semibold text-red-800 dark:text-red-200">Warning</h5>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    This action is permanent and cannot be undone. All student data, marks, and records will be permanently deleted.
                  </p>
                </div>
                
                <Button variant="destructive" className="w-full">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Student
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Help & Support</CardTitle>
                  <CardDescription>Get assistance when you need it</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary">Need Help?</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">kenkendagor3@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp/Call</p>
                      <p className="text-sm text-muted-foreground">+254768731991</p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;