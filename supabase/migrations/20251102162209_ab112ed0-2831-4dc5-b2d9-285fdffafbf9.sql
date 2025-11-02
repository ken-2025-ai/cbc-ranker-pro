-- Fix infinite recursion in institution_staff RLS policies
DROP POLICY IF EXISTS "Admins can manage institution staff" ON institution_staff;
DROP POLICY IF EXISTS "Staff can update own profile" ON institution_staff;
DROP POLICY IF EXISTS "Staff can view same institution staff" ON institution_staff;
DROP POLICY IF EXISTS "institution_staff_delete_policy" ON institution_staff;
DROP POLICY IF EXISTS "institution_staff_insert_policy" ON institution_staff;
DROP POLICY IF EXISTS "institution_staff_select_policy" ON institution_staff;
DROP POLICY IF EXISTS "institution_staff_update_policy" ON institution_staff;

-- Create simple, non-recursive policies for institution_staff
CREATE POLICY "staff_select_policy" ON institution_staff
  FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM admin_institutions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "staff_insert_policy" ON institution_staff
  FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT id FROM admin_institutions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "staff_update_policy" ON institution_staff
  FOR UPDATE
  USING (
    institution_id IN (
      SELECT id FROM admin_institutions WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "staff_delete_policy" ON institution_staff
  FOR DELETE
  USING (
    institution_id IN (
      SELECT id FROM admin_institutions WHERE user_id = auth.uid()
    )
  );