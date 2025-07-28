-- Update RLS policy to allow viewing students without institution_id
DROP POLICY IF EXISTS "Users can view students from their institution" ON public.students;

CREATE POLICY "Users can view all students" 
ON public.students 
FOR SELECT 
USING (true);

-- Also allow anonymous users to view students for the registration form
CREATE POLICY "Anyone can view students" 
ON public.students 
FOR SELECT 
USING (true);