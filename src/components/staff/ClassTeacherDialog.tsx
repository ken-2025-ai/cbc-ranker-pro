import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { assignClassTeacher, getClassTeachers } from '@/utils/teacherAssignmentUtils';

interface ClassTeacherDialogProps {
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

export const ClassTeacherDialog = ({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  institutionId,
  onSuccess
}: ClassTeacherDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState<string[]>([]);
  const [existingClassTeachers, setExistingClassTeachers] = useState<any[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [existingTeacher, setExistingTeacher] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStreams();
      loadClassTeachers();
    }
  }, [open]);

  useEffect(() => {
    if (selectedGrade && selectedStream) {
      checkExistingClassTeacher();
    } else {
      setExistingTeacher(null);
    }
  }, [selectedGrade, selectedStream]);

  const fetchStreams = async () => {
    const { data } = await import('@/integrations/supabase/client').then(m => 
      m.supabase.from('admin_institutions').select('streams').eq('id', institutionId).single()
    );
    setStreams(data?.streams || ['A', 'B', 'C', 'D']);
  };

  const loadClassTeachers = async () => {
    try {
      const data = await getClassTeachers(institutionId);
      setExistingClassTeachers(data);
    } catch (error) {
      console.error('Error loading class teachers:', error);
    }
  };

  const checkExistingClassTeacher = () => {
    const existing = existingClassTeachers.find(
      ct => ct.grade === selectedGrade && ct.stream === selectedStream
    );
    
    if (existing && existing.teacher_id !== teacherId) {
      setExistingTeacher(existing.teacher?.email || 'Another teacher');
    } else {
      setExistingTeacher(null);
    }
  };

  const handleAssign = async () => {
    if (!selectedGrade || !selectedStream) {
      toast({
        title: 'Validation Error',
        description: 'Please select grade and stream',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      await assignClassTeacher(
        teacherId,
        institutionId,
        selectedGrade,
        selectedStream
      );
      
      toast({
        title: 'Success',
        description: existingTeacher 
          ? 'Class teacher reassigned successfully' 
          : 'Class teacher assigned successfully'
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning class teacher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign class teacher',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {teacherName} as Class Teacher</DialogTitle>
          <DialogDescription>
            Select the grade and stream for class teacher responsibility
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Class teachers have additional administrative privileges for their assigned class
            </AlertDescription>
          </Alert>

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

          {existingTeacher && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> {existingTeacher} is currently the class teacher for this class. 
                They will be replaced if you proceed.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedGrade || !selectedStream}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              existingTeacher ? 'Replace Class Teacher' : 'Assign as Class Teacher'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};