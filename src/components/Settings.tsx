import { useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  AlertTriangle,
  Sun,
  Moon,
  Crown
} from "lucide-react";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [curriculumLevel, setCurriculumLevel] = useState("upper-primary");
  const [schoolName, setSchoolName] = useState("Your School Name");
  const [streams] = useState(["8A", "8B", "8C", "7A", "7B"]);

  const isDarkMode = theme === "dark";

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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-3 sm:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <div className="p-2 sm:p-3 rounded-full bg-primary/10">
              <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent text-center">
              CBC Settings
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Configure your institution's grading system, manage academic data, and customize your CBC experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Theme Toggle Section */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                    <span>🌗</span>
                    Command of the Crown
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base italic">
                    Noble user, choose thy realm!
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-4 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border border-primary/10">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-medium">
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    <span className="font-bold">Light Mode</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
                    Let your screen glow with the brilliance of day, illuminating every scroll and script with clarity and grace.
                  </p>
                </div>
                
                <div className="flex items-center justify-center py-3 sm:py-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Label 
                      htmlFor="theme-toggle" 
                      className="flex items-center gap-1 sm:gap-2 cursor-pointer text-sm sm:text-base"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                      <span className="font-medium">Light</span>
                    </Label>
                    <Switch
                      id="theme-toggle"
                      checked={isDarkMode}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      className="data-[state=checked]:bg-slate-600 scale-90 sm:scale-100"
                    />
                    <Label 
                      htmlFor="theme-toggle" 
                      className="flex items-center gap-1 sm:gap-2 cursor-pointer text-sm sm:text-base"
                      onClick={() => setTheme("dark")}
                    >
                      <span className="font-medium">Dark</span>
                      <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-medium">
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                    <span className="font-bold">Dark Mode</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
                    Embrace the shadows of the night, where focus deepens and your eyes rest under the gentle veil of darkness.
                  </p>
                </div>
              </div>
              
              <div className="text-center p-3 sm:p-4 rounded-lg bg-secondary/30 border border-primary/20">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  ⚔️ <em>Switch between kingdoms with the Royal Toggle above. Your preference shall reign until you decree otherwise.</em>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Grading System Controls */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-2xl">Grading System Controls</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Configure curriculum level and grade boundaries</CardDescription>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {currentGrades.map((grade, index) => (
                    <Card key={index} className="border-2 hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <Badge variant={grade.color as any} className="mb-2 w-full justify-center py-1 text-xs sm:text-sm">
                          {grade.range}
                        </Badge>
                        <p className="text-xs sm:text-sm font-medium text-foreground leading-tight">{grade.grade}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institution Controls */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <School className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Institution Controls</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Manage school information and streams</CardDescription>
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Enter new stream (e.g., 8D)" className="flex-1" />
                  <Button className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]">
                    <Plus className="h-4 w-4" />
                    <span className="sm:inline">Add Stream</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account & Security Settings */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Account & Security</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Manage your account security settings</CardDescription>
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
                  
                  <Button className="w-full min-h-[44px]">Update Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Removal Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <UserMinus className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Student Management</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Remove students from the system</CardDescription>
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
                
                <Button variant="destructive" className="w-full min-h-[44px]">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Student
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Help & Support</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Get assistance when you need it</CardDescription>
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
                
                <Button className="w-full min-h-[44px]" variant="outline">
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