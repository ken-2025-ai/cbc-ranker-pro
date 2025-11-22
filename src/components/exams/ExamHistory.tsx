import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Eye, Loader2, FileText, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import html2pdf from "html2pdf.js";

interface Exam {
  id: string;
  school_name: string;
  class_level: string;
  exam_type: string;
  subject: string;
  paper_number: number;
  total_marks: number;
  question_count: number;
  status: string;
  created_at: string;
  print_html: string | null;
  validation_errors: any;
  warnings: any;
}

const ExamHistory = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('owner_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`Loaded ${data?.length || 0} exams for user`);
      
      // Parse JSON fields and ensure proper types
      const parsedExams = (data || []).map(exam => ({
        ...exam,
        validation_errors: Array.isArray(exam.validation_errors) ? exam.validation_errors : 
                          (typeof exam.validation_errors === 'string' ? JSON.parse(exam.validation_errors) : []),
        warnings: Array.isArray(exam.warnings) ? exam.warnings :
                 (typeof exam.warnings === 'string' ? JSON.parse(exam.warnings) : [])
      }));
      
      setExams(parsedExams as Exam[]);
    } catch (error) {
      console.error('Error loading exams:', error);
      toast({
        title: "Error",
        description: "Failed to load exam history. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (exam: Exam) => {
    if (!exam.print_html) {
      toast({
        title: "No Content",
        description: "This exam doesn't have print content yet",
        variant: "destructive"
      });
      return;
    }

    setDownloadingId(exam.id);
    try {
      const element = document.createElement('div');
      element.innerHTML = exam.print_html;

      const opt = {
        margin: 10,
        filename: `${exam.subject}_${exam.class_level}_${exam.exam_type}_Paper${exam.paper_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();

      toast({
        title: "Success",
        description: "Exam PDF downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      // First delete associated exam questions
      const { error: questionsError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', examToDelete);

      if (questionsError) throw questionsError;

      // Then delete the exam
      const { error: examError } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete);

      if (examError) throw examError;

      toast({
        title: "Success",
        description: "Exam deleted successfully"
      });

      setDeleteDialogOpen(false);
      setExamToDelete(null);
      await loadExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      generating: "default",
      generated: "default",
      error: "destructive",
      final: "default"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Exams Yet</h3>
          <p className="text-muted-foreground">
            Generate your first exam to see it here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <Card key={exam.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {exam.subject} - {exam.class_level}
                </CardTitle>
                <CardDescription>
                  {exam.exam_type} | Paper {exam.paper_number} | {exam.school_name}
                </CardDescription>
              </div>
              {getStatusBadge(exam.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
              <div>
                <strong>Questions:</strong> {exam.question_count}
              </div>
              <div>
                <strong>Total Marks:</strong> {exam.total_marks}
              </div>
              <div>
                <strong>Generated:</strong> {format(new Date(exam.created_at), 'MMM d, yyyy')}
              </div>
            </div>

            {exam.warnings && exam.warnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <strong>Warnings:</strong>
                </div>
                <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  {exam.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {exam.validation_errors && exam.validation_errors.length > 0 && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <strong>Errors:</strong>
                </div>
                <ul className="mt-2 text-sm text-destructive list-disc list-inside">
                  {exam.validation_errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPDF(exam)}
                disabled={exam.status !== 'generated' || !exam.print_html || downloadingId === exam.id}
              >
                {downloadingId === exam.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExamToDelete(exam.id);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExamToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExam} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamHistory;