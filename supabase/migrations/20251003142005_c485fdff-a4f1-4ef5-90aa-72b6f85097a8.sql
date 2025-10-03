-- Add 'lower_primary' as a valid level for subjects
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_level_check;

ALTER TABLE public.subjects ADD CONSTRAINT subjects_level_check 
CHECK (level IN ('lower_primary', 'upper_primary', 'junior_secondary'));

-- Now add the lower primary subjects for classes 1, 2, and 3
INSERT INTO public.subjects (name, code, level, institution_id)
VALUES
  ('Literacy Activities', 'LIT', 'lower_primary', NULL),
  ('English Language Activities', 'ENG', 'lower_primary', NULL),
  ('Kiswahili Language Activities', 'KIS', 'lower_primary', NULL),
  ('Indigenous Language Activities', 'IND', 'lower_primary', NULL),
  ('Mathematical Activities', 'MATH', 'lower_primary', NULL),
  ('Environmental Activities', 'ENV', 'lower_primary', NULL),
  ('Hygiene and Nutrition Activities', 'HYG', 'lower_primary', NULL),
  ('Religious Education Activities', 'CRE', 'lower_primary', NULL),
  ('Movement and Creative Activities', 'MCA', 'lower_primary', NULL)
ON CONFLICT DO NOTHING;