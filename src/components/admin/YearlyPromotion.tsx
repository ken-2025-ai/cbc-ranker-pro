import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, AlertTriangle, TrendingUp, Users, CheckCircle2, Download, Mail, Database, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface YearEndResult {
  yearEndDate?: string;
  studentsPromoted?: number;
  studentsDeleted?: number;
  marksDeleted?: number;
  examPeriodsDeleted?: number;
  examsDeleted?: number;
  serverStorageBeforeKB?: number;
  serverStorageAfterCleanupKB?: number;
  storageSavedKB?: number;
  preview?: boolean;
  studentsToPromote?: number;
  studentsToDelete?: number;
  marksToDelete?: number;
  examPeriodsToDelete?: number;
  examsToDelete?: number;
  message?: string;
}

export default function YearlyPromotion() {
  const { institutionId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [previewResults, setPreviewResults] = useState<YearEndResult | null>(null);
  const [promotionResults, setPromotionResults] = useState<YearEndResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const currentYear = new Date().getFullYear();

  const handlePreview = async () => {
    if (!institutionId) {
      toast.error("Institution ID not found");
      return;
    }

    setLoading(true);
    setBackupProgress(0);
    try {
      const { data, error } = await supabase.rpc('year_end_promotion', {
        p_institution_id: institutionId,
        apply_changes: false
      });

      if (error) throw error;

      setPreviewResults(data as YearEndResult);
      toast.success("Preview completed - Review the changes below");
    } catch (error: any) {
      console.error("Error running preview:", error);
      toast.error(error.message || "Failed to run preview");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupAndDownload = async () => {
    if (!institutionId) {
      toast.error("Institution ID not found");
      return;
    }

    setLoading(true);
    setBackupProgress(10);
    try {
      // Get institution details
      const { data: institution } = await supabase
        .from('admin_institutions')
        .select('name, email')
        .eq('id', institutionId)
        .single();

      setBackupProgress(30);

      // Call backup function
      const { data: backupData, error: backupError } = await supabase.functions.invoke('year-end-backup', {
        body: {
          institution_id: institutionId,
          institution_email: institution?.email,
          institution_name: institution?.name,
        }
      });

      if (backupError) throw backupError;

      setBackupProgress(70);

      // Download backup locally
      const dataStr = JSON.stringify(backupData.backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `year-end-backup-${institutionId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupProgress(100);

      toast.success(backupData.emailSent 
        ? "Backup created, downloaded, and emailed successfully!" 
        : "Backup created and downloaded successfully!");
    } catch (error: any) {
      console.error("Error creating backup:", error);
      toast.error(error.message || "Failed to create backup");
    } finally {
      setLoading(false);
      setTimeout(() => setBackupProgress(0), 2000);
    }
  };

  const handleApplyPromotion = async () => {
    if (!institutionId || confirmationText !== `PROMOTE ${currentYear}`) {
      toast.error("Please type the correct confirmation text");
      return;
    }

    setLoading(true);
    setBackupProgress(10);
    try {
      // Apply year-end promotion with full cleanup
      const { data, error } = await supabase.rpc('year_end_promotion', {
        p_institution_id: institutionId,
        apply_changes: true
      });

      if (error) throw error;

      setBackupProgress(100);
      setPromotionResults(data as YearEndResult);

      const result = data as YearEndResult;

      // Log the action
      const { error: logError } = await supabase.from('admin_activity_logs').insert({
        action_type: 'year_end_promotion',
        description: `Year-end promotion applied: ${result.studentsPromoted} promoted, ${result.studentsDeleted} deleted, ${result.marksDeleted} marks cleaned`,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (logError) console.error("Failed to log action:", logError);

      toast.success("Year-end promotion completed successfully!");
      setShowConfirmDialog(false);
      setConfirmationText("");
      setPreviewResults(null);
    } catch (error: any) {
      console.error("Error applying promotion:", error);
      toast.error(error.message || "Failed to apply promotion");
    } finally {
      setLoading(false);
      setTimeout(() => setBackupProgress(0), 2000);
    }
  };

  const formatStorage = (kb: number) => {
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Year-End Student Promotion & Data Cleanup
          </CardTitle>
          <CardDescription>
            Comprehensive year-end process: Backup data, promote students, and cleanup server storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-destructive">CRITICAL: Read Before Proceeding</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong>Backup First:</strong> Create and download backup before promotion</li>
                  <li><strong>Grade 9 Students:</strong> Will be permanently deleted</li>
                  <li><strong>All Exam Data:</strong> Marks, exam periods, and exams will be deleted</li>
                  <li><strong>Server Storage:</strong> Only students and staff records will remain</li>
                  <li><strong>Irreversible:</strong> This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {backupProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              onClick={handlePreview}
              disabled={loading}
              variant={previewResults ? "success" : "outline"}
              className="h-auto flex-col gap-3 py-6 relative overflow-hidden group transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Preview year-end changes before applying"
            >
              {loading && !previewResults ? (
                <div className="animate-spin">
                  <TrendingUp className="h-6 w-6" />
                </div>
              ) : (
                <TrendingUp className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              )}
              <div className="text-center">
                <div className="font-semibold text-base">1. Preview Changes</div>
                <div className="text-xs opacity-80 mt-1">
                  {loading && !previewResults ? "Analyzing..." : "See what will change"}
                </div>
              </div>
              {previewResults && (
                <Badge variant="outline" className="absolute top-2 right-2 bg-success/10 text-success border-success/20">
                  Complete
                </Badge>
              )}
            </Button>

            <Button
              onClick={handleBackupAndDownload}
              disabled={loading || !previewResults}
              variant={backupProgress === 100 ? "success" : "outline"}
              className="h-auto flex-col gap-3 py-6 relative overflow-hidden group transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Backup all data before promotion"
              title={!previewResults ? "Complete preview first" : "Create and download backup"}
            >
              {loading && backupProgress > 0 && backupProgress < 100 ? (
                <div className="animate-pulse">
                  <Download className="h-6 w-6" />
                </div>
              ) : (
                <Download className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              )}
              <div className="text-center">
                <div className="font-semibold text-base">2. Backup Data</div>
                <div className="text-xs opacity-80 mt-1">
                  {loading && backupProgress > 0 && backupProgress < 100
                    ? `Backing up... ${backupProgress}%`
                    : backupProgress === 100
                    ? "Backup complete"
                    : "Download & email"}
                </div>
              </div>
              {backupProgress === 100 && (
                <Badge variant="outline" className="absolute top-2 right-2 bg-success/10 text-success border-success/20">
                  Complete
                </Badge>
              )}
              {!previewResults && (
                <Badge variant="outline" className="absolute top-2 right-2 bg-muted text-muted-foreground">
                  Locked
                </Badge>
              )}
            </Button>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={loading || !previewResults}
              variant="destructive"
              className="h-auto flex-col gap-3 py-6 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Apply year-end promotion and cleanup"
              title={!previewResults ? "Complete preview first" : "Execute promotion with full cleanup"}
            >
              {loading && showConfirmDialog ? (
                <div className="animate-spin">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              ) : (
                <CheckCircle2 className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              )}
              <div className="text-center">
                <div className="font-semibold text-base">3. Apply Promotion</div>
                <div className="text-xs opacity-90 mt-1">
                  {loading && showConfirmDialog ? "Processing..." : "Execute changes"}
                </div>
              </div>
              {!previewResults && (
                <Badge variant="outline" className="absolute top-2 right-2 bg-muted text-muted-foreground">
                  Locked
                </Badge>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/5 to-destructive/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {previewResults && (
        <Card>
          <CardHeader>
            <CardTitle>Year-End Changes Preview</CardTitle>
            <CardDescription>
              Review what will happen when you apply the promotion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Users className="h-8 w-8 text-success opacity-50" />
                      <Badge variant="outline">Promotion</Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">
                        {previewResults.studentsToPromote || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Students to Promote</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <GraduationCap className="h-8 w-8 text-destructive opacity-50" />
                      <Badge variant="destructive">Deletion</Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">
                        {previewResults.studentsToDelete || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Grade 9 to Delete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Database className="h-8 w-8 text-amber-500 opacity-50" />
                      <Badge variant="outline">Data Cleanup</Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-500">
                        {previewResults.marksToDelete || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Marks to Delete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Trash2 className="h-8 w-8 text-orange-500 opacity-50" />
                      <Badge variant="outline">Cleanup</Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-500">
                        {(previewResults.examPeriodsToDelete || 0) + (previewResults.examsToDelete || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Exams & Periods</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What Will Happen:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                  <span>{previewResults.studentsToPromote} students will be promoted to the next grade</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <span>{previewResults.studentsToDelete} Grade 9 students will be deleted permanently</span>
                </div>
                <div className="flex items-start gap-2">
                  <Trash2 className="h-4 w-4 text-amber-500 mt-0.5" />
                  <span>All {previewResults.marksToDelete} marks will be deleted from server</span>
                </div>
                <div className="flex items-start gap-2">
                  <Database className="h-4 w-4 text-orange-500 mt-0.5" />
                  <span>{previewResults.examPeriodsToDelete} exam periods and {previewResults.examsToDelete} exams will be deleted</span>
                </div>
                <div className="flex items-start gap-2">
                  <Database className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>Only student records and staff data will remain on server</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotion Results */}
      {promotionResults && !promotionResults.preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Year-End Promotion Completed
            </CardTitle>
            <CardDescription>
              Summary of changes applied to your system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-success">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-success mb-2" />
                    <p className="text-3xl font-bold text-success">{promotionResults.studentsPromoted}</p>
                    <p className="text-sm text-muted-foreground mt-1">Students Promoted</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <GraduationCap className="h-8 w-8 mx-auto text-destructive mb-2" />
                    <p className="text-3xl font-bold text-destructive">{promotionResults.studentsDeleted}</p>
                    <p className="text-sm text-muted-foreground mt-1">Grade 9 Deleted</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Database className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                    <p className="text-3xl font-bold text-amber-500">{promotionResults.marksDeleted}</p>
                    <p className="text-sm text-muted-foreground mt-1">Marks Cleaned</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Trash2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-3xl font-bold text-blue-500">
                      {(promotionResults.examPeriodsDeleted || 0) + (promotionResults.examsDeleted || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Exams Removed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-success/5 border-success">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Server Storage Optimization
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Before Cleanup</p>
                      <p className="font-semibold">{formatStorage(promotionResults.serverStorageBeforeKB || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">After Cleanup</p>
                      <p className="font-semibold">{formatStorage(promotionResults.serverStorageAfterCleanupKB || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Storage Saved</p>
                      <p className="font-semibold text-success">{formatStorage(promotionResults.storageSavedKB || 0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              <p>Completed on {new Date(promotionResults.yearEndDate || '').toLocaleString()}</p>
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
              className="bg-destructive hover:bg-destructive/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Confirm and execute year-end promotion"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Applying Changes...
                </span>
              ) : (
                "Apply Promotion"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
