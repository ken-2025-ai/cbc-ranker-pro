import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, AlertTriangle, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PromotionResult {
  action: string;
  grade: number;
  stream: string;
  student_count: number;
}

export default function YearlyPromotion() {
  const { institutionId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dryRunResults, setDryRunResults] = useState<PromotionResult[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const currentYear = new Date().getFullYear();

  const handleDryRun = async () => {
    if (!institutionId) {
      toast.error("Institution ID not found");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('promote_students', {
        p_institution_id: institutionId,
        apply_changes: false
      });

      if (error) throw error;

      setDryRunResults(data || []);
      toast.success("Dry run completed successfully");
    } catch (error: any) {
      console.error("Error running dry run:", error);
      toast.error(error.message || "Failed to run dry run");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromotion = async () => {
    if (!institutionId || confirmationText !== `PROMOTE ${currentYear}`) {
      toast.error("Please type the correct confirmation text");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('promote_students', {
        p_institution_id: institutionId,
        apply_changes: true
      });

      if (error) throw error;

      // Log the promotion
      const { error: logError } = await supabase.from('promotion_logs').insert({
        institution_id: institutionId,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        action: 'applied',
        details: { results: data, timestamp: new Date().toISOString() }
      });

      if (logError) console.error("Failed to log promotion:", logError);

      toast.success("Students promoted successfully!");
      setShowConfirmDialog(false);
      setConfirmationText("");
      setDryRunResults([]);
    } catch (error: any) {
      console.error("Error applying promotion:", error);
      toast.error(error.message || "Failed to apply promotion");
    } finally {
      setLoading(false);
    }
  };

  const getTotalStudents = () => {
    return dryRunResults.reduce((sum, result) => sum + result.student_count, 0);
  };

  const getGrade9Count = () => {
    const grade9Result = dryRunResults.find(r => r.action === 'would_delete' && r.grade === 9);
    return grade9Result ? grade9Result.student_count : 0;
  };

  const getPromotionCount = () => {
    return dryRunResults
      .filter(r => r.action === 'would_promote')
      .reduce((sum, result) => sum + result.student_count, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Yearly Student Promotion
          </CardTitle>
          <CardDescription>
            Promote students to the next grade level and graduate Grade 9 students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold">Important Notice</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Grade 9 students will be permanently deleted</li>
                  <li>Students in Grades 1-8 will be promoted to the next grade</li>
                  <li>Student streams will be preserved during promotion</li>
                  <li>This action cannot be undone - please backup your data first</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleDryRun}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {loading ? "Running Preview..." : "Preview Changes (Dry Run)"}
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={loading || dryRunResults.length === 0}
              variant="destructive"
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply Promotion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dry Run Results */}
      {dryRunResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Promotion Preview</CardTitle>
            <CardDescription>
              Review the changes that will be made
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Grade 9 Students</p>
                      <p className="text-2xl font-bold text-destructive">{getGrade9Count()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Will be deleted</p>
                    </div>
                    <Users className="h-8 w-8 text-destructive opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Students Promoted</p>
                      <p className="text-2xl font-bold text-success">{getPromotionCount()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Grades 1-8</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-success opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Affected</p>
                      <p className="text-2xl font-bold">{getTotalStudents()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Students</p>
                    </div>
                    <GraduationCap className="h-8 w-8 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <div>
              <h3 className="font-semibold mb-3">Detailed Breakdown</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Current Grade</TableHead>
                      <TableHead>Stream</TableHead>
                      <TableHead className="text-right">Student Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dryRunResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={result.action === 'would_delete' ? 'destructive' : 'default'}>
                            {result.action === 'would_delete' ? 'Delete' : 'Promote'}
                          </Badge>
                        </TableCell>
                        <TableCell>Grade {result.grade}</TableCell>
                        <TableCell>{result.stream || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {result.student_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Yearly Promotion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action will permanently delete all Grade 9 students and promote all other students.
                <strong> This cannot be undone.</strong>
              </p>
              <p>
                To confirm, please type: <code className="bg-muted px-2 py-1 rounded">PROMOTE {currentYear}</code>
              </p>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type: PROMOTE ${currentYear}`}
                className="font-mono"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplyPromotion}
              disabled={confirmationText !== `PROMOTE ${currentYear}` || loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Applying..." : "Apply Promotion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
