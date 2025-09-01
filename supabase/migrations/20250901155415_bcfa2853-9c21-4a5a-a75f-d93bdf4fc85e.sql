-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_notifications 
  SET is_read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_expire_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Auto-expire notifications older than 30 days if not specified
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;