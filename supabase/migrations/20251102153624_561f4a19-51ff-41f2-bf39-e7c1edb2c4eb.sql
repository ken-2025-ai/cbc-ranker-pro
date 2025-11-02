-- Drop existing problematic policies on institution_staff
DROP POLICY IF EXISTS "Users can view staff from their institution" ON institution_staff;
DROP POLICY IF EXISTS "Institution admins can manage staff" ON institution_staff;
DROP POLICY IF EXISTS "Staff can view their own record" ON institution_staff;

-- Create non-recursive RLS policies for institution_staff
-- Policy 1: Allow users to view staff from their own institution
CREATE POLICY "institution_staff_select_policy" ON institution_staff
  FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM admin_institutions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Allow institution admins to insert staff
CREATE POLICY "institution_staff_insert_policy" ON institution_staff
  FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT id FROM admin_institutions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Allow institution admins to update staff
CREATE POLICY "institution_staff_update_policy" ON institution_staff
  FOR UPDATE
  USING (
    institution_id IN (
      SELECT id FROM admin_institutions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Allow institution admins to delete staff
CREATE POLICY "institution_staff_delete_policy" ON institution_staff
  FOR DELETE
  USING (
    institution_id IN (
      SELECT id FROM admin_institutions 
      WHERE user_id = auth.uid()
    )
  );