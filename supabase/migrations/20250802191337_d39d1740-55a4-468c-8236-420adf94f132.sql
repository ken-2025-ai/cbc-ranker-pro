-- Insert a default institution
INSERT INTO public.institutions (name, email, code, address, phone) 
VALUES ('Default School', 'admin@defaultschool.edu', 'DS001', '123 Education St', '+1234567890');

-- Get the current user and associate them with the institution
INSERT INTO public.institution_users (user_id, institution_id, role)
SELECT 
  auth.uid(),
  i.id,
  'admin'
FROM public.institutions i 
WHERE i.name = 'Default School'
AND auth.uid() IS NOT NULL;