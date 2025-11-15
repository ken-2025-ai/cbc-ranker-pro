-- Fix search_path for subscription and promotion functions
DROP FUNCTION IF EXISTS check_subscription_status(uuid);
DROP FUNCTION IF EXISTS promote_students(uuid, boolean);
DROP FUNCTION IF EXISTS expire_old_subscriptions();

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION check_subscription_status(p_institution_id uuid)
RETURNS TABLE(is_active boolean, expiry_date timestamptz, days_remaining integer) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (s.status = 'active' AND s.expiry_date > now()) as is_active,
    s.expiry_date,
    EXTRACT(DAY FROM (s.expiry_date - now()))::integer as days_remaining
  FROM subscriptions s
  WHERE s.institution_id = p_institution_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION promote_students(
  p_institution_id uuid,
  apply_changes boolean DEFAULT false
)
RETURNS TABLE(
  action text,
  grade integer,
  stream text,
  student_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  grade_9_count integer;
BEGIN
  IF apply_changes THEN
    PERFORM pg_advisory_xact_lock(hashtext('promote_' || p_institution_id::text));
    
    SELECT COUNT(*) INTO grade_9_count
    FROM students
    WHERE institution_id = p_institution_id AND grade = '9';
    
    DELETE FROM students
    WHERE institution_id = p_institution_id AND grade = '9';
    
    UPDATE students
    SET grade = (grade::integer + 1)::text
    WHERE institution_id = p_institution_id 
      AND grade::integer BETWEEN 1 AND 8;
    
    RETURN QUERY
    SELECT 'deleted'::text, 9, ''::text, grade_9_count
    UNION ALL
    SELECT 'promoted'::text, (grade::integer - 1), stream, COUNT(*)::integer
    FROM students
    WHERE institution_id = p_institution_id AND grade::integer BETWEEN 2 AND 9
    GROUP BY grade, stream
    ORDER BY grade;
  ELSE
    RETURN QUERY
    SELECT 'would_delete'::text, 9, stream, COUNT(*)::integer
    FROM students
    WHERE institution_id = p_institution_id AND grade = '9'
    GROUP BY stream
    UNION ALL
    SELECT 'would_promote'::text, grade::integer, stream, COUNT(*)::integer
    FROM students
    WHERE institution_id = p_institution_id AND grade::integer BETWEEN 1 AND 8
    GROUP BY grade, stream
    ORDER BY grade;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS integer 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE subscriptions
  SET status = 'expired', updated_at = now()
  WHERE expiry_date < now() 
    AND status = 'active';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;