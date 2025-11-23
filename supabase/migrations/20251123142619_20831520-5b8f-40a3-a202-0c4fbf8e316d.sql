-- Support Staff System Migration
-- Creates tables for support team authentication, activity tracking, and system monitoring

-- 1. Support Staff Roles Enum
CREATE TYPE public.support_role AS ENUM ('level_1', 'level_2', 'level_3', 'admin');

-- 2. Support Staff Table
CREATE TABLE public.support_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role support_role NOT NULL DEFAULT 'level_1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMPTZ
);

-- 3. Support Sessions Table
CREATE TABLE public.support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_staff_id UUID NOT NULL REFERENCES public.support_staff(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Support Activity Logs Table
CREATE TABLE public.support_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_staff_id UUID NOT NULL REFERENCES public.support_staff(id),
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. System Metrics Table (for live monitoring)
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_support_staff_email ON public.support_staff(email);
CREATE INDEX idx_support_sessions_token ON public.support_sessions(session_token);
CREATE INDEX idx_support_sessions_expires ON public.support_sessions(expires_at);
CREATE INDEX idx_support_activity_logs_staff ON public.support_activity_logs(support_staff_id);
CREATE INDEX idx_support_activity_logs_created ON public.support_activity_logs(created_at DESC);
CREATE INDEX idx_system_metrics_type ON public.system_metrics(metric_type);
CREATE INDEX idx_system_metrics_recorded ON public.system_metrics(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.support_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (managed by edge functions with service role)
CREATE POLICY "Support staff access via service role" ON public.support_staff FOR ALL USING (true);
CREATE POLICY "Support sessions access via service role" ON public.support_sessions FOR ALL USING (true);
CREATE POLICY "Support activity logs access via service role" ON public.support_activity_logs FOR ALL USING (true);
CREATE POLICY "System metrics access via service role" ON public.system_metrics FOR ALL USING (true);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_support_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_staff_updated_at
  BEFORE UPDATE ON public.support_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_staff_updated_at();

-- Function to check if support staff exists
CREATE OR REPLACE FUNCTION public.is_support_staff(staff_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.support_staff
    WHERE email = staff_email
      AND is_active = true
  );
$$;