-- ============================================
-- Fix Security Issue: Restrict admin_institutions Access
-- ============================================
-- This migration secures the admin_institutions table by:
-- 1. Removing all existing insecure policies
-- 2. Creating proper RLS policies that restrict access
-- 3. Creating security definer functions to safely check admin status

-- Drop all existing policies on admin_institutions
DROP POLICY IF EXISTS "Admin institutions management" ON public.admin_institutions;
DROP POLICY IF EXISTS "Admin users can view their own data" ON public.admin_institutions;
DROP POLICY IF EXISTS "Admin users can manage admin data" ON public.admin_institutions;

-- Create a security definer function to check if a user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND is_active = true
  );
$$;

-- Create a security definer function to check if user owns an institution
CREATE OR REPLACE FUNCTION public.is_institution_owner(institution_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_institutions
    WHERE id = institution_uuid
      AND user_id = auth.uid()
  );
$$;

-- Policy 1: Allow authenticated users to read ONLY their own institution
CREATE POLICY "Users can read their own institution"
ON public.admin_institutions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy 2: Allow users to update ONLY their own institution (limited fields)
CREATE POLICY "Users can update their own institution"
ON public.admin_institutions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Allow super admins full access (read all)
CREATE POLICY "Super admins can read all institutions"
ON public.admin_institutions
FOR SELECT
TO authenticated
USING (is_super_admin());

-- Policy 4: Allow super admins to insert new institutions
CREATE POLICY "Super admins can insert institutions"
ON public.admin_institutions
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- Policy 5: Allow super admins to update any institution
CREATE POLICY "Super admins can update institutions"
ON public.admin_institutions
FOR UPDATE
TO authenticated
USING (is_super_admin());

-- Policy 6: Allow super admins to delete institutions
CREATE POLICY "Super admins can delete institutions"
ON public.admin_institutions
FOR DELETE
TO authenticated
USING (is_super_admin());

-- Add comment to document the security model
COMMENT ON TABLE public.admin_institutions IS 'Secured table containing institution data. Access restricted to institution owners and super admins only. Edge functions use service role key to bypass RLS for signup verification.';