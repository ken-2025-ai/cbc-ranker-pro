-- Drop the existing restrictive insert policy for students
DROP POLICY IF EXISTS "Users can insert students to their institution" ON public.students;

-- Create a new policy that allows anyone to insert students
CREATE POLICY "Anyone can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (true);