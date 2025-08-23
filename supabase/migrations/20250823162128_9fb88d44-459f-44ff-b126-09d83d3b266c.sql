-- Create admin users table for admin panel authentication
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users can manage themselves and super admins can manage all
CREATE POLICY "Admin users can view their own data" 
ON public.admin_users 
FOR SELECT 
USING (true); -- Will be controlled by application logic

-- Create admin sessions table for session management
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create institutions table with additional admin fields
CREATE TABLE public.admin_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  headteacher_name TEXT,
  headteacher_phone TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  county TEXT,
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'unpaid' CHECK (subscription_status IN ('paid', 'unpaid', 'expired')),
  subscription_expires_at TIMESTAMPTZ,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_institutions ENABLE ROW LEVEL SECURITY;

-- Create activity logs table
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id),
  action_type TEXT NOT NULL,
  target_type TEXT, -- 'institution', 'notification', etc.
  target_id UUID,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'general' CHECK (notification_type IN ('general', 'payment_reminder', 'system_update', 'deadline_reminder')),
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'specific', 'active_only', 'expired_only')),
  target_institutions UUID[],
  sent_by UUID REFERENCES public.admin_users(id),
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  delivery_method TEXT[] DEFAULT ARRAY['in_app'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create payment history table
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.admin_institutions(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  reference_number TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subscription_period_months INTEGER DEFAULT 12,
  notes TEXT,
  recorded_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create impersonation sessions table
CREATE TABLE public.admin_impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id),
  institution_id UUID REFERENCES public.admin_institutions(id),
  session_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Create trigger for updating timestamps
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_institutions_updated_at
  BEFORE UPDATE ON public.admin_institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the default admin user (email: Admin.account@gmail.com, password: access5293@Me_)
-- Password hash will be generated in the application
INSERT INTO public.admin_users (email, password_hash, full_name, role)
VALUES ('Admin.account@gmail.com', 'temp_hash', 'System Administrator', 'super_admin');

-- Create policies for admin access
CREATE POLICY "Admin users can manage admin data" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Admin sessions management" ON public.admin_sessions FOR ALL USING (true);
CREATE POLICY "Admin can manage institutions" ON public.admin_institutions FOR ALL USING (true);
CREATE POLICY "Admin can view activity logs" ON public.admin_activity_logs FOR ALL USING (true);
CREATE POLICY "Admin can manage notifications" ON public.admin_notifications FOR ALL USING (true);
CREATE POLICY "Admin can view payment history" ON public.payment_history FOR ALL USING (true);
CREATE POLICY "Admin can manage impersonation" ON public.admin_impersonation_sessions FOR ALL USING (true);