import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Eye, Loader2, FileText, AlertCircle, Trash2, BookOpen } from "lucide-react";
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
  marking_scheme_text: string | null;
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

  const handleDownloadMarkingScheme = async (exam: Exam) => {
    if (!exam.marking_scheme_text) {
      toast({
        title: "No Marking Scheme",
        description: "This exam doesn't have a marking scheme yet",
        variant: "destructive"
      });
      return;
    }

    setDownloadingId(exam.id + '_scheme');
    try {
      // Fetch the exam questions to build a comprehensive marking scheme
      const { data: questions, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('number', { ascending: true });

      if (error) throw error;

      // Generate marking scheme HTML
      const markingSchemeHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .header h1 { margin: 5px 0; font-size: 20px; }
            .header h2 { margin: 5px 0; font-size: 16px; font-weight: normal; }
            .section { margin: 20px 0; page-break-inside: avoid; }
            .question { margin: 15px 0; padding: 10px; border-left: 3px solid #2563eb; background: #f8fafc; }
            .question-number { font-weight: bold; color: #2563eb; margin-bottom: 8px; }
            .question-text { margin: 8px 0; color: #333; }
            .marking-rubric { margin: 10px 0; padding: 10px; background: #fff; border: 1px solid #e2e8f0; }
            .marks { color: #059669; font-weight: bold; }
            .answer { margin: 8px 0; padding: 8px; background: #ecfdf5; border-radius: 4px; }
            .bloom-level { display: inline-block; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 12px; margin-left: 10px; }
            .strand { color: #7c3aed; font-weight: 500; margin-bottom: 5px; }
            .total-marks { text-align: center; margin: 20px 0; padding: 15px; background: #1e40af; color: white; font-size: 18px; font-weight: bold; }
            h3 { color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
            .rubric-item { margin: 5px 0; padding-left: 20px; }
            @media print {
              .question { page-break-inside: avoid; }
              body { margin: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${exam.school_name.toUpperCase()}</h1>
            <h2>${exam.class_level} ${exam.exam_type}</h2>
            <h2>${exam.subject} - Paper ${exam.paper_number}</h2>
            <h2>MARKING SCHEME</h2>
          </div>
          
          <div class="total-marks">
            TOTAL MARKS: ${exam.total_marks}
          </div>

          <div class="section">
            <h3>General Instructions for Markers</h3>
            <p>• Award marks according to the marking rubric provided for each question.</p>
            <p>• Accept any scientifically correct alternative answers not listed in the scheme.</p>
            <p>• Award marks for workings shown even if final answer is incorrect.</p>
            <p>• Be consistent in marking across all scripts.</p>
            <p>• Deduct marks for incomplete or partially correct answers as specified.</p>
          </div>

          ${questions?.map(q => `
            <div class="question">
              <div class="question-number">
                Question ${q.number}
                ${q.bloom_level ? `<span class="bloom-level">${q.bloom_level}</span>` : ''}
                <span class="marks">(${q.marks} marks)</span>
              </div>
              
              ${q.strand ? `<div class="strand">Strand: ${q.strand}${q.sub_strand ? ` - ${q.sub_strand}` : ''}</div>` : ''}
              
              <div class="question-text">${q.question_text}</div>
              
              <div class="marking-rubric">
                <strong>Expected Answer:</strong>
                <div class="answer">${q.expected_answer}</div>
                
                <strong>Marking Rubric:</strong>
                ${typeof q.marking_rubric === 'object' && q.marking_rubric ? 
                  Object.entries(q.marking_rubric).map(([key, value]) => 
                    `<div class="rubric-item">• ${key}: ${value}</div>`
                  ).join('') 
                  : '<div class="rubric-item">Award full marks for correct answer as specified above.</div>'
                }
              </div>
            </div>
          `).join('') || ''}

          <div style="margin-top: 30px; padding: 15px; background: #f1f5f9; border-radius: 8px;">
            <strong>End of Marking Scheme</strong>
            <p style="margin: 5px 0;">Total Questions: ${questions?.length || 0}</p>
            <p style="margin: 5px 0;">Total Marks: ${exam.total_marks}</p>
          </div>
        </body>
        </html>
      `;

      const element = document.createElement('div');
      element.innerHTML = markingSchemeHTML;

      const opt = {
        margin: 10,
        filename: `${exam.subject}_${exam.class_level}_${exam.exam_type}_Paper${exam.paper_number}_MARKING_SCHEME.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();

      toast({
        title: "Success",
        description: "Marking scheme downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating marking scheme PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate marking scheme PDF",
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

            <div className="flex flex-wrap gap-2">
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
                    Download Exam
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleDownloadMarkingScheme(exam)}
                disabled={exam.status !== 'generated' || !exam.marking_scheme_text || downloadingId === exam.id + '_scheme'}
              >
                {downloadingId === exam.id + '_scheme' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Marking Scheme
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