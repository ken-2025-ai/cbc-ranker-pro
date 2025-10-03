-- Drop the existing CHECK constraint
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_grade_valid;

-- Add new CHECK constraint that includes grades 1-9
ALTER TABLE public.students 
ADD CONSTRAINT students_grade_valid 
CHECK (grade = ANY (ARRAY['1'::text, '2'::text, '3'::text, '4'::text, '5'::text, '6'::text, '7'::text, '8'::text, '9'::text]));