-- Drop existing policy and recreate to allow anonymous ticket creation
DROP POLICY IF EXISTS "Anyone can create help tickets" ON public.help_tickets;

-- Create policy that explicitly allows anonymous inserts
CREATE POLICY "Allow anonymous ticket creation"
  ON public.help_tickets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);