-- Fix RLS policy for exam_periods to allow proper insertion
DROP POLICY IF EXISTS "Users can insert exam periods to their institution" ON public.exam_periods;

-- Create a more permissive policy for inserting exam periods
CREATE POLICY "Users can insert exam periods" 
ON public.exam_periods 
FOR INSERT 
WITH CHECK (true);

-- Also ensure users can view exam periods they create
DROP POLICY IF EXISTS "Users can view exam periods from their institution" ON public.exam_periods;

CREATE POLICY "Users can view exam periods" 
ON public.exam_periods 
FOR SELECT 
USING (true);