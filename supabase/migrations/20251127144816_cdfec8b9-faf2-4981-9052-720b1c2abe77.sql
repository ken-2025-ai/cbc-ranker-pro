-- Phase 1: Billing System with Credits and M-PESA Integration

-- School credits table (tracks overpayments and available student capacity)
CREATE TABLE IF NOT EXISTS school_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  credit_amount INTEGER NOT NULL DEFAULT 0, -- Amount in cents (Ksh * 100)
  credit_students INTEGER NOT NULL DEFAULT 0, -- Available student slots from credits (credit_amount / 1500)
  total_earned INTEGER NOT NULL DEFAULT 0, -- Lifetime credits earned
  total_consumed INTEGER NOT NULL DEFAULT 0, -- Lifetime credits consumed
  last_credit_at TIMESTAMPTZ,
  last_consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(institution_id)
);

-- Billing transactions (all payments and charges)
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'term_payment', 'student_add', 'exam_generation', 'credit_earn', 'credit_consume'
  amount INTEGER NOT NULL, -- Amount in cents (positive for payments, negative for charges)
  balance_before INTEGER NOT NULL, -- Credit balance before this transaction
  balance_after INTEGER NOT NULL, -- Credit balance after this transaction
  student_count INTEGER, -- Number of students involved (for student_add)
  rate_per_student INTEGER, -- Rate charged (1500 or 2000 cents)
  exam_count INTEGER, -- Number of exams generated (for exam_generation)
  description TEXT NOT NULL,
  mpesa_receipt_number TEXT, -- M-PESA receipt code
  mpesa_phone_number TEXT, -- Phone number used for payment
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  idempotency_key TEXT UNIQUE, -- Prevent duplicate charges
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_institution ON billing_transactions(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_type ON billing_transactions(transaction_type, payment_status);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_idempotency ON billing_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- M-PESA payment requests (STK Push tracking)
CREATE TABLE IF NOT EXISTS mpesa_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  merchant_request_id TEXT,
  checkout_request_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  account_reference TEXT NOT NULL, -- Institution ID or custom ref
  transaction_desc TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TIMESTAMPTZ,
  callback_received_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mpesa_requests_checkout ON mpesa_payment_requests(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_requests_institution ON mpesa_payment_requests(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mpesa_requests_status ON mpesa_payment_requests(status);

-- Exam payment records (links exams to payments)
CREATE TABLE IF NOT EXISTS exam_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES admin_institutions(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  billing_transaction_id UUID REFERENCES billing_transactions(id) ON DELETE SET NULL,
  exam_details JSONB NOT NULL, -- {class_level, subject, exam_type, generated_at}
  amount_charged INTEGER NOT NULL, -- 5000 cents (50 Ksh)
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_payments_institution ON exam_payments(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_payments_status ON exam_payments(payment_status);

-- Audit log for billing (immutable)
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'payment', 'charge', 'credit_earn', 'credit_consume', 'refund'
  amount INTEGER NOT NULL,
  performed_by UUID, -- User who triggered the action
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_audit_institution ON billing_audit_log(institution_id, created_at DESC);

-- Add billing columns to admin_institutions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_institutions' AND column_name='current_student_count') THEN
    ALTER TABLE admin_institutions ADD COLUMN current_student_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_institutions' AND column_name='max_student_capacity') THEN
    ALTER TABLE admin_institutions ADD COLUMN max_student_capacity INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_institutions' AND column_name='billing_contact_phone') THEN
    ALTER TABLE admin_institutions ADD COLUMN billing_contact_phone TEXT;
  END IF;
END $$;

-- Function to initialize school credits
CREATE OR REPLACE FUNCTION initialize_school_credit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO school_credits (institution_id, credit_amount, credit_students)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (institution_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create credits for new institutions
DROP TRIGGER IF EXISTS trigger_initialize_school_credit ON admin_institutions;
CREATE TRIGGER trigger_initialize_school_credit
  AFTER INSERT ON admin_institutions
  FOR EACH ROW
  EXECUTE FUNCTION initialize_school_credit();

-- Function to update school credit balance and student capacity
CREATE OR REPLACE FUNCTION update_school_credit(
  p_institution_id UUID,
  p_amount_change INTEGER, -- Change in cents (positive for add, negative for consume)
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
  -- Get current credit
  SELECT credit_amount INTO v_current_credit
  FROM school_credits
  WHERE institution_id = p_institution_id
  FOR UPDATE;
  
  -- Calculate new values
  v_new_credit := v_current_credit + p_amount_change;
  v_new_students := FLOOR(v_new_credit / 1500.0); -- 15 Ksh = 1500 cents per student
  
  -- Update credits
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize credits for existing institutions
INSERT INTO school_credits (institution_id, credit_amount, credit_students)
SELECT id, 0, 0 FROM admin_institutions
ON CONFLICT (institution_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON school_credits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON mpesa_payment_requests TO authenticated;
GRANT SELECT, INSERT ON exam_payments TO authenticated;
GRANT SELECT, INSERT ON billing_audit_log TO authenticated;

COMMENT ON TABLE school_credits IS 'Tracks overpayment credits and available student capacity for each school';
COMMENT ON TABLE billing_transactions IS 'Immutable ledger of all billing activities with idempotency support';
COMMENT ON TABLE mpesa_payment_requests IS 'Tracks M-PESA STK Push requests and callbacks';
COMMENT ON TABLE exam_payments IS 'Links exam generations to their payment transactions (50 Ksh per exam)';