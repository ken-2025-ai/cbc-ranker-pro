-- Fix security issues: RLS policies and function search paths (fixed)

-- Enable RLS on all new billing tables
ALTER TABLE school_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpesa_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for school_credits
CREATE POLICY "Institutions can view their own credits"
  ON school_credits FOR SELECT
  USING (institution_id = get_user_institution());

CREATE POLICY "Support staff can view all credits"
  ON school_credits FOR SELECT
  USING (is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "System can update credits"
  ON school_credits FOR UPDATE
  USING (institution_id = get_user_institution() OR is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

-- RLS Policies for billing_transactions
CREATE POLICY "Institutions can view their own transactions"
  ON billing_transactions FOR SELECT
  USING (institution_id = get_user_institution());

CREATE POLICY "Support staff can view all transactions"
  ON billing_transactions FOR SELECT
  USING (is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "System can insert transactions"
  ON billing_transactions FOR INSERT
  WITH CHECK (institution_id = get_user_institution() OR is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Support can update transaction status"
  ON billing_transactions FOR UPDATE
  USING (is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

-- RLS Policies for mpesa_payment_requests
CREATE POLICY "Institutions can view their own mpesa requests"
  ON mpesa_payment_requests FOR SELECT
  USING (institution_id = get_user_institution());

CREATE POLICY "Support staff can view all mpesa requests"
  ON mpesa_payment_requests FOR SELECT
  USING (is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Institutions can create mpesa requests"
  ON mpesa_payment_requests FOR INSERT
  WITH CHECK (institution_id = get_user_institution());

CREATE POLICY "System can update mpesa request status"
  ON mpesa_payment_requests FOR UPDATE
  USING (true); -- Allow M-PESA callback to update any request

-- RLS Policies for exam_payments
CREATE POLICY "Institutions can view their own exam payments"
  ON exam_payments FOR SELECT
  USING (institution_id = get_user_institution());

CREATE POLICY "Support staff can view all exam payments"
  ON exam_payments FOR SELECT
  USING (is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Institutions can create exam payments"
  ON exam_payments FOR INSERT
  WITH CHECK (institution_id = get_user_institution());

-- RLS Policies for billing_audit_log
CREATE POLICY "Support staff can view all audit logs"
  ON billing_audit_log FOR SELECT
  USING (is_support_staff((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "System can insert audit logs"
  ON billing_audit_log FOR INSERT
  WITH CHECK (true);

-- Fix function search paths by dropping trigger, recreating function, then recreating trigger
DROP TRIGGER IF EXISTS trigger_initialize_school_credit ON admin_institutions;

CREATE OR REPLACE FUNCTION initialize_school_credit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO school_credits (institution_id, credit_amount, credit_students)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (institution_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_initialize_school_credit
  AFTER INSERT ON admin_institutions
  FOR EACH ROW
  EXECUTE FUNCTION initialize_school_credit();

-- Fix update_school_credit function
CREATE OR REPLACE FUNCTION update_school_credit(
  p_institution_id UUID,
  p_amount_change INTEGER,
  p_transaction_id UUID
)
RETURNS TABLE(
  new_credit_amount INTEGER,
  new_credit_students INTEGER
) AS $$
DECLARE
  v_current_credit INTEGER;
  v_new_credit INTEGER;
  v_new_students INTEGER;
BEGIN
  SELECT credit_amount INTO v_current_credit
  FROM school_credits
  WHERE institution_id = p_institution_id
  FOR UPDATE;
  
  v_new_credit := v_current_credit + p_amount_change;
  v_new_students := FLOOR(v_new_credit / 1500.0);
  
  UPDATE school_credits
  SET 
    credit_amount = v_new_credit,
    credit_students = v_new_students,
    total_earned = CASE WHEN p_amount_change > 0 THEN total_earned + p_amount_change ELSE total_earned END,
    total_consumed = CASE WHEN p_amount_change < 0 THEN total_consumed + ABS(p_amount_change) ELSE total_consumed END,
    last_credit_at = CASE WHEN p_amount_change > 0 THEN NOW() ELSE last_credit_at END,
    last_consumed_at = CASE WHEN p_amount_change < 0 THEN NOW() ELSE last_consumed_at END,
    updated_at = NOW()
  WHERE institution_id = p_institution_id;
  
  RETURN QUERY SELECT v_new_credit, v_new_students;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;