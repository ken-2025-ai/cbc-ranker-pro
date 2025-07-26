-- Make institution_id nullable in students table to allow registration without authentication
ALTER TABLE public.students 
ALTER COLUMN institution_id DROP NOT NULL;