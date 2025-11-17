-- Drop and recreate check_subscription_status to use admin_institutions table
DROP FUNCTION IF EXISTS public.check_subscription_status(uuid);

CREATE OR REPLACE FUNCTION public.check_subscription_status(p_institution_id uuid)
RETURNS TABLE(is_active boolean, expiry_date timestamp with time zone, days_remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (ai.subscription_status = 'active' AND ai.subscription_expires_at > now()) as is_active,
    ai.subscription_expires_at as expiry_date,
    EXTRACT(DAY FROM (ai.subscription_expires_at - now()))::integer as days_remaining
  FROM admin_institutions ai
  WHERE ai.id = p_institution_id
  LIMIT 1;
END;
$$;