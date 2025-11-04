-- Allow staff members to view their own record in institution_staff
CREATE POLICY "staff_can_view_own_record" ON institution_staff
  FOR SELECT
  USING (user_id = auth.uid());