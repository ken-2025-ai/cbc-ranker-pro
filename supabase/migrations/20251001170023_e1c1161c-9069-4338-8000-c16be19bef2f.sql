-- First, delete ALL students from the system
DELETE FROM students;

-- Enhance ACID properties for the students table

-- 1. Add unique constraint for admission_number per institution (Consistency)
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_admission_number_institution_unique;

ALTER TABLE public.students 
ADD CONSTRAINT students_admission_number_institution_unique 
UNIQUE (admission_number, institution_id);

-- 2. Add check constraints for data integrity (Consistency)
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_grade_valid;

ALTER TABLE public.students 
ADD CONSTRAINT students_grade_valid 
CHECK (grade IN ('4', '5', '6', '7', '8', '9'));

-- 3. Make institution_id NOT NULL for referential integrity (Consistency)
ALTER TABLE public.students 
ALTER COLUMN institution_id SET NOT NULL;

-- 4. Add indexes for better query performance with isolation
CREATE INDEX IF NOT EXISTS idx_students_institution_year 
ON public.students(institution_id, year);

CREATE INDEX IF NOT EXISTS idx_students_admission_number 
ON public.students(admission_number);

-- 5. Add updated_at trigger for durability tracking
CREATE OR REPLACE FUNCTION public.update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_updated_at_trigger ON public.students;

CREATE TRIGGER students_updated_at_trigger
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_students_updated_at();

-- 6. Add validation trigger for atomicity
CREATE OR REPLACE FUNCTION public.validate_student_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate full_name
  IF NEW.full_name IS NULL OR TRIM(NEW.full_name) = '' THEN
    RAISE EXCEPTION 'Student full name cannot be empty';
  END IF;
  
  -- Validate admission_number
  IF NEW.admission_number IS NULL OR TRIM(NEW.admission_number) = '' THEN
    RAISE EXCEPTION 'Admission number cannot be empty';
  END IF;
  
  -- Validate year
  IF NEW.year < 2020 OR NEW.year > 2100 THEN
    RAISE EXCEPTION 'Invalid year: must be between 2020 and 2100';
  END IF;
  
  -- Trim whitespace
  NEW.full_name = TRIM(NEW.full_name);
  NEW.admission_number = TRIM(NEW.admission_number);
  IF NEW.stream IS NOT NULL THEN
    NEW.stream = TRIM(NEW.stream);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_validation_trigger ON public.students;

CREATE TRIGGER students_validation_trigger
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_data();

-- 7. Add audit log table for durability and tracking
CREATE TABLE IF NOT EXISTS public.student_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.student_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view audit logs from their institution" ON public.student_audit_log;

CREATE POLICY "Users can view audit logs from their institution"
ON public.student_audit_log
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students 
    WHERE institution_id = get_user_institution_id()
  )
);

-- 8. Create audit trigger for complete transaction history
CREATE OR REPLACE FUNCTION public.audit_student_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.student_audit_log (student_id, action, old_data, changed_by)
    VALUES (OLD.id, 'DELETE', row_to_json(OLD)::jsonb, auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.student_audit_log (student_id, action, old_data, new_data, changed_by)
    VALUES (NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.student_audit_log (student_id, action, new_data, changed_by)
    VALUES (NEW.id, 'INSERT', row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS students_audit_trigger ON public.students;

CREATE TRIGGER students_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_student_changes();