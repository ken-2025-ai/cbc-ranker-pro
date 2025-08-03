-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view exam periods" ON public.exam_periods;
DROP POLICY IF EXISTS "Users can insert exam periods" ON public.exam_periods;
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
DROP POLICY IF EXISTS "Users can view all students" ON public.students;
DROP POLICY IF EXISTS "Anyone can insert students" ON public.students;

-- Create proper institution-based policies for exam_periods
CREATE POLICY "Users can view exam periods from their institution" 
ON public.exam_periods 
FOR SELECT 
USING (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

CREATE POLICY "Users can insert exam periods for their institution" 
ON public.exam_periods 
FOR INSERT 
WITH CHECK (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

-- Create proper institution-based policies for students
CREATE POLICY "Users can view students from their institution" 
ON public.students 
FOR SELECT 
USING (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

CREATE POLICY "Users can insert students for their institution" 
ON public.students 
FOR INSERT 
WITH CHECK (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

-- Add institution_id to subjects table to make it institution-specific
ALTER TABLE public.subjects ADD COLUMN institution_id uuid;

-- Drop the overly permissive subjects policy
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;

-- Create proper institution-based policies for subjects
CREATE POLICY "Users can view subjects from their institution" 
ON public.subjects 
FOR SELECT 
USING (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

CREATE POLICY "Users can insert subjects for their institution" 
ON public.subjects 
FOR INSERT 
WITH CHECK (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

CREATE POLICY "Users can update subjects from their institution" 
ON public.subjects 
FOR UPDATE 
USING (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

CREATE POLICY "Users can delete subjects from their institution" 
ON public.subjects 
FOR DELETE 
USING (institution_id IN (
  SELECT institution_users.institution_id
  FROM institution_users
  WHERE institution_users.user_id = auth.uid()
));

-- Update existing subjects to belong to the default institution
UPDATE public.subjects 
SET institution_id = (SELECT id FROM public.institutions WHERE name = 'Default School')
WHERE institution_id IS NULL;