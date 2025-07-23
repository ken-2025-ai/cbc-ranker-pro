import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, TrendingUp, FileText, GraduationCap, Award } from "lucide-react";
import cbcHeaderImage from "@/assets/cbc-header.jpg";

const Dashboard = () => {
  const stats = [
    { title: "Total Students", value: "1,247", icon: Users, change: "+12%" },
    { title: "Active Classes", value: "24", icon: GraduationCap, change: "+2" },
    { title: "Subjects", value: "12", icon: BookOpen, change: "0" },
    { title: "Average Performance", value: "72.4%", icon: TrendingUp, change: "+3.2%" },
  ];

  const quickActions = [
    { title: "Add New Student", description: "Register a new student to the system", icon: Users },
    { title: "Enter Marks", description: "Input subject marks for students", icon: BookOpen },
    { title: "Generate Reports", description: "Create student report cards", icon: FileText },
    { title: "View Rankings", description: "Check class and stream rankings", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div 
          className="h-64 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${cbcHeaderImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary-light/60" />
          <div className="relative z-10 flex items-center justify-center h-full text-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl font-bold text-white mb-4">
                CBC Academic Record System
              </h1>
              <p className="text-xl text-white/90 max-w-2xl">
                Comprehensive student management for Upper Primary and Junior Secondary schools across Kenya
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-16 relative z-20">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={stat.title} className="shadow-card hover:shadow-elevated transition-smooth animate-slide-up bg-gradient-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success">{stat.change}</span> from last term
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Card key={action.title} className="group cursor-pointer hover:shadow-elevated transition-bounce shadow-card" style={{ animationDelay: `${(index + 4) * 0.1}s` }}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="academic" className="w-full" size="sm">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Grade 6A Mathematics</span>
                  <span className="text-sm text-success">+5.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Grade 7B English</span>
                  <span className="text-sm text-success">+3.1%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Grade 5 Science</span>
                  <span className="text-sm text-warning">-1.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Quick Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Term 3 Performance Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Top Performers Summary
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Class Attendance Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;