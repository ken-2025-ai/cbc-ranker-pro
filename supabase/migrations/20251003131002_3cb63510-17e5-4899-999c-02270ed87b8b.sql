-- Add streams column to admin_institutions table to store custom stream names
ALTER TABLE public.admin_institutions 
ADD COLUMN IF NOT EXISTS streams TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment to document the column
COMMENT ON COLUMN public.admin_institutions.streams IS 'Array of custom stream names (e.g., A, B, Blue, Red) configured by the institution';