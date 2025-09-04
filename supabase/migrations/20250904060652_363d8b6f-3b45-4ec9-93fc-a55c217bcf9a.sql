-- Fix function search path security issues
-- Update existing functions to have immutable search_path for security

-- Fix the get_user_institution_id function
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
 RETURNS UUID
 LANGUAGE SQL
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT institution_id FROM profiles WHERE user_id = auth.uid();
$$;

-- Fix the mark_notification_read function
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

-- Fix the auto_expire_notifications function
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

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  RETURN NEW;
END;
$$;

-- Fix the generate_result_code function
CREATE OR REPLACE FUNCTION public.generate_result_code()
 RETURNS TEXT
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := 'KYC-' || upper(substring(md5(random()::text) from 1 for 4));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_count 
    FROM public.saved_results 
    WHERE result_code = code;
    
    -- Exit loop if code is unique
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;