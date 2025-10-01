-- Fix security warnings for function search paths

-- Update the update_students_updated_at function with proper search_path
CREATE OR REPLACE FUNCTION public.update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update the validate_student_data function with proper search_path
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
$$ LANGUAGE plpgsql SET search_path = public;