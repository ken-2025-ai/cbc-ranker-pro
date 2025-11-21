-- Create help_tickets table for user support requests
CREATE TABLE IF NOT EXISTS public.help_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.admin_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_help_tickets_status ON public.help_tickets(status);
CREATE INDEX IF NOT EXISTS idx_help_tickets_created_at ON public.help_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_help_tickets_email ON public.help_tickets(email);
CREATE INDEX IF NOT EXISTS idx_help_tickets_ticket_number ON public.help_tickets(ticket_number);

-- Enable RLS
ALTER TABLE public.help_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create tickets (public access for login page)
CREATE POLICY "Anyone can create help tickets"
  ON public.help_tickets
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admin users can view all tickets
CREATE POLICY "Admin users can view all help tickets"
  ON public.help_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Policy: Admin users can update tickets
CREATE POLICY "Admin users can update help tickets"
  ON public.help_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    ticket_num := 'TKT-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.help_tickets WHERE ticket_number = ticket_num;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.help_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger to update updated_at
CREATE TRIGGER trigger_help_tickets_updated_at
  BEFORE UPDATE ON public.help_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();