-- Fix search_path for help ticket functions properly
-- Drop trigger first, then recreate everything with proper search_path

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.help_tickets;
DROP FUNCTION IF EXISTS set_ticket_number();
DROP FUNCTION IF EXISTS generate_ticket_number();

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.help_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();