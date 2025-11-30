import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  checkSubjectConflict,
  assignSubjectToTeacher,
  type ConflictResult
} from '@/utils/teacherAssignmentUtils';
import { supabase } from '@/integrations/supabase/client';

interface SubjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
  institutionId: string;
  onSuccess: () => void;
}

const grades = [
  { value: "PP1", label: "PP1" },
  { value: "PP2", label: "PP2" },
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

export const SubjectAssignmentDialog = ({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  institutionId,
  onSuccess
}: SubjectAssignmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isCoTeaching, setIsCoTeaching] = useState(false);
  
  const [conflicts, setConflicts] = useState<ConflictResult | null>(null);

  useEffect(() => {
    if (open) {
      fetchStreams();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      loadSubjects();
    }
  }, [open]);

  useEffect(() => {
    if (selectedSubject && selectedGrade && selectedStream) {
      checkConflicts();
    } else {
      setConflicts(null);
    }
  }, [selectedSubject, selectedGrade, selectedStream, isCoTeaching]);

  const fetchStreams = async () => {
    const { data } = await import('@/integrations/supabase/client').then(m => 
      m.supabase.from('admin_institutions').select('streams').eq('id', institutionId).single()
    );
    setStreams(data?.streams || ['A', 'B', 'C', 'D']);
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subjects',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = async () => {
    try {
      setChecking(true);
      const result = await checkSubjectConflict(
        teacherId,
        institutionId,
        selectedSubject,
        selectedGrade,
        selectedStream
      );
      setConflicts(result);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedGrade || !selectedStream || !selectedSubject) {
      toast({
        title: 'Validation Error',
        description: 'Please select grade, stream, and subject',
        variant: 'destructive'
      });
      return;
    }

    // Block if there are error-level conflicts
    if (conflicts?.has_conflicts && conflicts.conflicts.some(c => c.severity === 'error' && !isCoTeaching)) {
      toast({
        title: 'Cannot Assign',
        description: 'Resolve conflicts or enable co-teaching',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      await assignSubjectToTeacher(
        teacherId,
        institutionId,
        selectedSubject,
        selectedGrade,
        selectedStream,
        isCoTeaching
      );
      
      toast({
        title: 'Success',
        description: 'Subject assigned successfully'
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning subject:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign subject',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getConflictIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <Info className="h-4 w-4 text-warning" />;
      default: return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Subject to {teacherName}</DialogTitle>
          <DialogDescription>
            Select subject, grade, and stream with automatic conflict detection
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Grade *</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stream *</Label>
            <Select value={selectedStream} onValueChange={setSelectedStream} disabled={!selectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>
              <SelectContent>
                {streams.map((stream) => (
                  <SelectItem key={stream} value={stream}>
                    {stream}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                ) : (
                  subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="co-teaching"
              checked={isCoTeaching}
              onCheckedChange={(checked) => setIsCoTeaching(checked as boolean)}
            />
            <Label htmlFor="co-teaching" className="text-sm cursor-pointer">
              Enable co-teaching (allow multiple teachers)
            </Label>
          </div>

          {checking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking conflicts...
            </div>
          )}

          {conflicts && !checking && (
            <div className="space-y-2">
              {conflicts.has_conflicts ? (
                conflicts.conflicts.map((conflict, idx) => (
                  <Alert key={idx} variant={conflict.severity === 'error' ? 'destructive' : 'default'}>
                    <div className="flex items-start gap-2">
                      {getConflictIcon(conflict.severity)}
                      <AlertDescription className="text-sm">{conflict.message}</AlertDescription>
                    </div>
                  </Alert>
                ))
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription className="text-sm">No conflicts detected</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || checking || !selectedSubject}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Subject'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};