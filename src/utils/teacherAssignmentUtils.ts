// DSA-optimized utility functions for teacher assignment with O(1) lookups

import { supabase } from '@/integrations/supabase/client';

// ========== DATA STRUCTURES (O(1) Access) ==========

// HashMap for subject lookup
export class SubjectMap {
  private map: Map<string, any>;
  
  constructor(subjects: any[]) {
    this.map = new Map(subjects.map(s => [s.id, s]));
  }
  
  get(id: string) {
    return this.map.get(id);
  }
  
  has(id: string): boolean {
    return this.map.has(id);
  }
}

// Hash Set for conflict detection (O(1))
export class ConflictDetector {
  private assignments: Set<string>;
  
  constructor() {
    this.assignments = new Set();
  }
  
  // Create unique key for assignment
  private createKey(subjectId: string, grade: string, stream: string): string {
    return `${subjectId}-${grade}-${stream}`;
  }
  
  hasConflict(subjectId: string, grade: string, stream: string): boolean {
    return this.assignments.has(this.createKey(subjectId, grade, stream));
  }
  
  addAssignment(subjectId: string, grade: string, stream: string): void {
    this.assignments.add(this.createKey(subjectId, grade, stream));
  }
  
  removeAssignment(subjectId: string, grade: string, stream: string): void {
    this.assignments.delete(this.createKey(subjectId, grade, stream));
  }
}

// Teacher workload calculator
export interface WorkloadMetrics {
  totalSubjects: number;
  totalClasses: number;
  totalStreams: number;
  isClassTeacher: boolean;
  maxRecommendedSubjects: number;
  maxRecommendedClasses: number;
  isOverloaded: boolean;
  workloadPercentage: number;
}

export const calculateWorkload = (
  subjectCount: number,
  classCount: number,
  streamCount: number,
  isClassTeacher: boolean,
  maxSubjects: number = 5,
  maxClasses: number = 8
): WorkloadMetrics => {
  const workloadPercentage = Math.min(
    (subjectCount / maxSubjects) * 100,
    100
  );
  
  return {
    totalSubjects: subjectCount,
    totalClasses: classCount,
    totalStreams: streamCount,
    isClassTeacher,
    maxRecommendedSubjects: maxSubjects,
    maxRecommendedClasses: maxClasses,
    isOverloaded: subjectCount > maxSubjects || classCount > maxClasses,
    workloadPercentage
  };
};

// ========== DATABASE OPERATIONS (Optimized) ==========

export interface ConflictResult {
  has_conflicts: boolean;
  conflicts: Array<{
    type: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

// Check for assignment conflicts using database function (O(1))
export const checkSubjectConflict = async (
  teacherId: string,
  institutionId: string,
  subjectId: string,
  grade: string,
  stream: string
): Promise<ConflictResult> => {
  try {
    const { data, error } = await supabase.rpc(
      'check_subject_assignment_conflict' as any,
      {
        p_teacher_id: teacherId,
        p_institution_id: institutionId,
        p_subject_id: subjectId,
        p_grade: grade,
        p_stream: stream
      }
    );
    
    if (error) throw error;
    
    // Type guard and safe parsing
    if (data && typeof data === 'object') {
      return {
        has_conflicts: Boolean((data as any).has_conflicts),
        conflicts: Array.isArray((data as any).conflicts) ? (data as any).conflicts : []
      };
    }
    
    return { has_conflicts: false, conflicts: [] };
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return { has_conflicts: false, conflicts: [] };
  }
};

// Assign subject to teacher
export const assignSubjectToTeacher = async (
  teacherId: string,
  institutionId: string,
  subjectId: string,
  grade: string,
  stream: string,
  isCoTeaching: boolean = false
) => {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .insert({
      teacher_id: teacherId,
      institution_id: institutionId,
      subject_id: subjectId,
      grade,
      stream,
      is_co_teaching: isCoTeaching,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Remove subject assignment
export const removeSubjectAssignment = async (assignmentId: string) => {
  const { error } = await supabase
    .from('teacher_subjects')
    .delete()
    .eq('id', assignmentId);
  
  if (error) throw error;
};

// Assign class teacher
export const assignClassTeacher = async (
  teacherId: string,
  institutionId: string,
  grade: string,
  stream: string
) => {
  // First, deactivate any existing class teacher
  await supabase
    .from('class_teachers')
    .update({ is_active: false })
    .eq('institution_id', institutionId)
    .eq('grade', grade)
    .eq('stream', stream)
    .eq('is_active', true);
  
  // Then assign new class teacher
  const { data, error } = await supabase
    .from('class_teachers')
    .insert({
      teacher_id: teacherId,
      institution_id: institutionId,
      grade,
      stream,
      assigned_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Get teacher workload
export const getTeacherWorkload = async (
  teacherId: string,
  institutionId: string
): Promise<WorkloadMetrics | null> => {
  const { data, error } = await supabase
    .from('teacher_workload' as any)
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('institution_id', institutionId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching workload:', error);
    return null;
  }
  
  if (!data) return null;
  
  const workloadData = data as any;
  return calculateWorkload(
    workloadData.total_subjects || 0,
    workloadData.total_classes || 0,
    workloadData.total_streams || 0,
    workloadData.is_class_teacher || false,
    workloadData.max_recommended_subjects || 5,
    workloadData.max_recommended_classes || 8
  );
};

// Get all subjects for grade level
export const getSubjectsForGrade = async (grade: string) => {
  // Determine level based on grade
  let level = 'Grade 7-9'; // Default
  
  if (grade === 'PP1' || grade === 'PP2') {
    level = grade;
  } else {
    const gradeNum = parseInt(grade);
    if (gradeNum >= 1 && gradeNum <= 3) level = 'Grade 1-3';
    else if (gradeNum >= 4 && gradeNum <= 6) level = 'Grade 4-6';
    else if (gradeNum >= 7 && gradeNum <= 9) level = 'Grade 7-9';
  }
  
  const { data, error } = await supabase
    .from('subjects' as any)
    .select('*')
    .eq('level', level)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
  
  return data || [];
};

// Get teacher's assigned subjects
export const getTeacherSubjects = async (
  teacherId: string,
  institutionId: string
) => {
  const { data, error } = await supabase
    .from('teacher_subjects' as any)
    .select(`
      *,
      subjects:subject_id (
        name,
        code,
        level,
        category
      )
    `)
    .eq('teacher_id', teacherId)
    .eq('institution_id', institutionId);
  
  if (error) throw error;
  return data || [];
};

// Get all class teachers for institution
export const getClassTeachers = async (institutionId: string) => {
  const { data, error } = await supabase
    .from('class_teachers' as any)
    .select('*')
    .eq('institution_id', institutionId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching class teachers:', error);
    return [];
  }
  
  return (data || []).map((ct: any) => ({
    ...ct,
    teacher: { email: '' } // Email would need to be fetched separately from auth.users
  }));
};