-- Add category column to subjects if not exists
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS category TEXT;

-- Teacher-Subject mapping (O(1) lookups with indexes)
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.admin_institutions(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  stream TEXT,
  is_co_teaching BOOLEAN DEFAULT false,
  max_students INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(teacher_id, subject_id, grade, stream, institution_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher ON public.teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_institution ON public.teacher_subjects(institution_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_lookup ON public.teacher_subjects(subject_id, grade, stream, institution_id);

-- Class teacher assignments (one per class-stream)
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.admin_institutions(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  stream TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_class_teacher 
  ON public.class_teachers(institution_id, grade, stream) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher ON public.class_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_institution ON public.class_teachers(institution_id);

-- Teacher workload tracking (cached for O(1) access)
CREATE TABLE IF NOT EXISTS public.teacher_workload (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.admin_institutions(id) ON DELETE CASCADE,
  total_subjects INTEGER DEFAULT 0,
  total_classes INTEGER DEFAULT 0,
  total_streams INTEGER DEFAULT 0,
  is_class_teacher BOOLEAN DEFAULT false,
  max_recommended_subjects INTEGER DEFAULT 5,
  max_recommended_classes INTEGER DEFAULT 8,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, institution_id)
);

-- Automatic workload tracking function
CREATE OR REPLACE FUNCTION public.update_teacher_workload()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.teacher_workload (teacher_id, institution_id, total_subjects, total_classes, total_streams, is_class_teacher)
  SELECT 
    COALESCE(NEW.teacher_id, OLD.teacher_id),
    COALESCE(NEW.institution_id, OLD.institution_id),
    COUNT(DISTINCT ts.subject_id),
    COUNT(DISTINCT ts.grade),
    COUNT(DISTINCT CONCAT(ts.grade, '-', ts.stream)),
    EXISTS(SELECT 1 FROM public.class_teachers ct WHERE ct.teacher_id = COALESCE(NEW.teacher_id, OLD.teacher_id) AND ct.is_active = true)
  FROM public.teacher_subjects ts
  WHERE ts.teacher_id = COALESCE(NEW.teacher_id, OLD.teacher_id)
    AND ts.institution_id = COALESCE(NEW.institution_id, OLD.institution_id)
  GROUP BY ts.teacher_id, ts.institution_id
  ON CONFLICT (teacher_id, institution_id) 
  DO UPDATE SET
    total_subjects = EXCLUDED.total_subjects,
    total_classes = EXCLUDED.total_classes,
    total_streams = EXCLUDED.total_streams,
    is_class_teacher = EXCLUDED.is_class_teacher,
    last_updated = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_workload_on_subject_assign ON public.teacher_subjects;
CREATE TRIGGER trigger_update_workload_on_subject_assign
AFTER INSERT OR UPDATE OR DELETE ON public.teacher_subjects
FOR EACH ROW EXECUTE FUNCTION public.update_teacher_workload();

DROP TRIGGER IF EXISTS trigger_update_workload_on_class_teacher ON public.class_teachers;
CREATE TRIGGER trigger_update_workload_on_class_teacher
AFTER INSERT OR UPDATE OR DELETE ON public.class_teachers
FOR EACH ROW EXECUTE FUNCTION public.update_teacher_workload();

-- Conflict detection function (O(1) with indexes)
CREATE OR REPLACE FUNCTION public.check_subject_assignment_conflict(
  p_teacher_id UUID,
  p_institution_id UUID,
  p_subject_id UUID,
  p_grade TEXT,
  p_stream TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_existing_teacher TEXT;
  v_teacher_load INTEGER;
  v_max_load INTEGER;
  v_conflicts JSONB := '[]'::JSONB;
BEGIN
  -- Check existing assignment (O(1) with index)
  SELECT u.email INTO v_existing_teacher
  FROM public.teacher_subjects ts
  JOIN auth.users u ON ts.teacher_id = u.id
  WHERE ts.subject_id = p_subject_id
    AND ts.grade = p_grade
    AND ts.stream = p_stream
    AND ts.institution_id = p_institution_id
    AND ts.teacher_id != p_teacher_id
    AND ts.is_co_teaching = false
  LIMIT 1;
  
  IF v_existing_teacher IS NOT NULL THEN
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'subject_conflict',
      'message', 'Subject already assigned to ' || v_existing_teacher,
      'severity', 'error'
    );
  END IF;
  
  -- Check workload (O(1) with unique constraint)
  SELECT total_subjects, max_recommended_subjects INTO v_teacher_load, v_max_load
  FROM public.teacher_workload
  WHERE teacher_id = p_teacher_id AND institution_id = p_institution_id;
  
  IF v_teacher_load >= v_max_load THEN
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'workload_warning',
      'message', 'Teacher has reached maximum recommended subjects (' || v_max_load || ')',
      'severity', 'warning'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'has_conflicts', jsonb_array_length(v_conflicts) > 0,
    'conflicts', v_conflicts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_workload ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Institution can manage teacher subjects" ON public.teacher_subjects;
CREATE POLICY "Institution can manage teacher subjects"
  ON public.teacher_subjects FOR ALL
  TO authenticated
  USING (institution_id = get_user_institution())
  WITH CHECK (institution_id = get_user_institution());

DROP POLICY IF EXISTS "Institution can manage class teachers" ON public.class_teachers;
CREATE POLICY "Institution can manage class teachers"
  ON public.class_teachers FOR ALL
  TO authenticated
  USING (institution_id = get_user_institution())
  WITH CHECK (institution_id = get_user_institution());

DROP POLICY IF EXISTS "Institution can view teacher workload" ON public.teacher_workload;
CREATE POLICY "Institution can view teacher workload"
  ON public.teacher_workload FOR SELECT
  TO authenticated
  USING (institution_id = get_user_institution());