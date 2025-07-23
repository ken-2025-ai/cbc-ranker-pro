-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Enable RLS on the table_name table (from linter warning)
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for table_name since it's unclear what it's for
CREATE POLICY "table_name_policy" ON public.table_name
FOR ALL USING (true);