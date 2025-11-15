-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  expiry_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('active','expired','pending','cancelled')) DEFAULT 'active',
  payment_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_institution ON subscriptions(institution_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expiry ON subscriptions(expiry_date) WHERE status = 'active';

-- Create subscription_requests table
CREATE TABLE IF NOT EXISTS subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES admin_institutions(id),
  institution_name text NOT NULL,
  contact_person text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  mpesa_code text NOT NULL,
  term text CHECK (term IN ('T1','T2','T3')),
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscription_requests_institution ON subscription_requests(institution_id);
CREATE INDEX idx_subscription_requests_status ON subscription_requests(status);

-- Create subscription_logs table
CREATE TABLE IF NOT EXISTS subscription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id),
  action text NOT NULL,
  meta jsonb,
  performed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscription_logs_subscription ON subscription_logs(subscription_id);

-- Create promotion_logs table for yearly promotions
CREATE TABLE IF NOT EXISTS promotion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES admin_institutions(id),
  performed_by uuid,
  action text NOT NULL CHECK (action IN ('dry_run', 'applied')),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_promotion_logs_institution ON promotion_logs(institution_id);

-- RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage subscriptions" ON subscriptions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies for subscription_requests
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create subscription requests" ON subscription_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view subscription requests" ON subscription_requests
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can update subscription requests" ON subscription_requests
  FOR UPDATE TO authenticated
  USING (true);

-- RLS policies for subscription_logs
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view subscription logs" ON subscription_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can insert subscription logs" ON subscription_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS policies for promotion_logs
ALTER TABLE promotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view promotion logs" ON promotion_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert promotion logs" ON promotion_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status(p_institution_id uuid)
RETURNS TABLE(is_active boolean, expiry_date timestamptz, days_remaining integer) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote students (dry run and apply)
CREATE OR REPLACE FUNCTION promote_students(
  p_institution_id uuid,
  apply_changes boolean DEFAULT false
)
RETURNS TABLE(
  action text,
  grade integer,
  stream text,
  student_count integer
) AS $$
DECLARE
  grade_9_count integer;
BEGIN
  IF apply_changes THEN
    -- Use advisory lock to prevent concurrent runs
    PERFORM pg_advisory_xact_lock(hashtext('promote_' || p_institution_id::text));
    
    -- Count and delete grade 9 students
    SELECT COUNT(*) INTO grade_9_count
    FROM students
    WHERE institution_id = p_institution_id AND grade = '9';
    
    DELETE FROM students
    WHERE institution_id = p_institution_id AND grade = '9';
    
    -- Promote other students
    UPDATE students
    SET grade = (grade::integer + 1)::text
    WHERE institution_id = p_institution_id 
      AND grade::integer BETWEEN 1 AND 8;
    
    -- Return summary
    RETURN QUERY
    SELECT 'deleted'::text, 9, ''::text, grade_9_count
    UNION ALL
    SELECT 'promoted'::text, (grade::integer - 1), stream, COUNT(*)::integer
    FROM students
    WHERE institution_id = p_institution_id AND grade::integer BETWEEN 2 AND 9
    GROUP BY grade, stream
    ORDER BY grade;
  ELSE
    -- Dry run - just show what would happen
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire subscriptions (can be called by cron)
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS integer AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;