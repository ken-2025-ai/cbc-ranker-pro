-- Sync admin_institutions into institutions to satisfy FK constraints
INSERT INTO public.institutions (id, name, email, code, address, phone, created_at, updated_at)
SELECT 
  ai.id,
  ai.name,
  ai.email,
  ai.username AS code,
  ai.address,
  ai.phone,
  now(),
  now()
FROM public.admin_institutions ai
WHERE NOT EXISTS (
  SELECT 1 FROM public.institutions i WHERE i.id = ai.id
);

-- Optional: ensure updated_at is set for existing institutions rows without it
UPDATE public.institutions SET updated_at = now() WHERE updated_at IS NULL;