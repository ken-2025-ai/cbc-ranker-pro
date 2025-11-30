import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Award, AlertTriangle } from 'lucide-react';
import type { WorkloadMetrics } from '@/utils/teacherAssignmentUtils';

interface TeacherWorkloadCardProps {
  workload: WorkloadMetrics | null;
  loading?: boolean;
}

export const TeacherWorkloadCard = ({ workload, loading }: TeacherWorkloadCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">Loading workload...</div>
        </CardContent>
      </Card>
    );
  }

  if (!workload) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">No workload data available</div>
        </CardContent>
      </Card>
    );
  }

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 80) return 'text-warning';
    return 'text-success';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Teacher Workload</CardTitle>
          {workload.isOverloaded && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Overloaded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workload Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Workload</span>
            <span className={`font-semibold ${getWorkloadColor(workload.workloadPercentage)}`}>
              {Math.round(workload.workloadPercentage)}%
            </span>
          </div>
          <Progress value={workload.workloadPercentage} className="h-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              Subjects
            </div>
            <div className="text-sm font-semibold">
              {workload.totalSubjects} / {workload.maxRecommendedSubjects}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Classes
            </div>
            <div className="text-sm font-semibold">
              {workload.totalClasses}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Streams
            </div>
            <div className="text-sm font-semibold">
              {workload.totalStreams}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              Class Teacher
            </div>
            <div>
              {workload.isClassTeacher ? (
                <Badge variant="secondary" className="text-xs">Yes</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">No</span>
              )}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {workload.isOverloaded && (
          <div className="text-xs text-destructive">
            ⚠️ Teacher workload exceeds recommended limits
          </div>
        )}
      </CardContent>
    </Card>
  );
};