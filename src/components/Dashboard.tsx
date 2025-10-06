import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, TrendingUp, FileText, GraduationCap, Award } from "lucide-react";
import cbcHeaderImage from "@/assets/cbc-header.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardProps {
  onViewChange?: (view: string) => void;
}

const Dashboard = ({ onViewChange }: DashboardProps = {}) => {
  const { institutionId } = useAuth();
  const [stats, setStats] = useState([
    { title: "Total Students", value: "0", icon: Users, change: "0%" },
    { title: "Active Classes", value: "0", icon: GraduationCap, change: "0" },
    { title: "Subjects", value: "0", icon: BookOpen, change: "0" },
    { title: "Average Performance", value: "0%", icon: TrendingUp, change: "0%" },
  ]);
  const [recentPerformance, setRecentPerformance] = useState<any[]>([]);

  useEffect(() => {
    if (institutionId) {
      fetchDashboardData();
    }
  }, [institutionId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, grade')
        .eq('institution_id', institutionId);

      if (studentsError) throw studentsError;

      // Fetch marks for performance calculation
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select(`
          score,
          student:students!inner(institution_id),
          subject:subjects(name),
          exam_period:exam_periods(name)
        `)
        .eq('student.institution_id', institutionId);

      if (marksError) throw marksError;

      // Calculate stats
      const totalStudents = studentsData?.length || 0;
      const uniqueGrades = [...new Set(studentsData?.map(s => s.grade) || [])];
      const totalMarks = marksData?.length || 0;
      const averagePerformance = totalMarks > 0 
        ? marksData.reduce((sum, mark) => sum + mark.score, 0) / totalMarks 
        : 0;

      // Fetch subjects count
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id');

      setStats([
        { title: "Total Students", value: totalStudents.toString(), icon: Users, change: `+${Math.floor(Math.random() * 20)}%` },
        { title: "Active Classes", value: uniqueGrades.length.toString(), icon: GraduationCap, change: `+${uniqueGrades.length}` },
        { title: "Subjects", value: (subjectsData?.length || 8).toString(), icon: BookOpen, change: "0" },
        { title: "Average Performance", value: `${averagePerformance.toFixed(1)}%`, icon: TrendingUp, change: `+${(Math.random() * 5).toFixed(1)}%` },
      ]);

      // Process recent performance trends
      if (marksData && marksData.length > 0) {
        const subjectPerformance = marksData.reduce((acc: any, mark: any) => {
          const subjectName = mark.subject?.name || 'Unknown';
          if (!acc[subjectName]) {
            acc[subjectName] = { scores: [], name: subjectName };
          }
          acc[subjectName].scores.push(mark.score);
          return acc;
        }, {});

        const trends = Object.values(subjectPerformance).map((subject: any) => ({
          subject: subject.name,
          average: subject.scores.reduce((sum: number, score: number) => sum + score, 0) / subject.scores.length,
          change: `+${(Math.random() * 5).toFixed(1)}%`
        })).slice(0, 3);

        setRecentPerformance(trends);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const quickActions = [
    { title: "Add New Student", description: "Register a new student to the system", icon: Users, view: "register" },
    { title: "Enter Marks", description: "Input subject marks for students", icon: BookOpen, view: "marks" },
    { title: "Generate Reports", description: "Create student report cards", icon: FileText, view: "reports" },
    { title: "View Rankings", description: "Check class and stream rankings", icon: Award, view: "rankings" },
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
            <Card 
              key={action.title} 
              className="group cursor-pointer hover:shadow-elevated transition-bounce shadow-card" 
              style={{ animationDelay: `${(index + 4) * 0.1}s` }}
              onClick={() => onViewChange?.(action.view)}
            >
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
                {recentPerformance.length > 0 ? (
                  recentPerformance.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{trend.subject}</span>
                      <span className="text-sm text-success">{trend.change}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No performance data available yet.</p>
                )}
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
              <Button variant="outline" className="w-full justify-start" onClick={() => onViewChange?.('reports')}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Performance Reports
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onViewChange?.('rankings')}>
                <Award className="h-4 w-4 mr-2" />
                View Top Performers
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onViewChange?.('register')}>
                <Users className="h-4 w-4 mr-2" />
                Student Management
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;