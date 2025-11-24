-- Create device_sessions table for tracking admin/support panel access
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'mobile', 'tablet', 'desktop'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL, -- 'admin', 'support', 'institution'
  institution_id UUID REFERENCES admin_institutions(id) ON DELETE CASCADE,
  ip_address INET,
  location_country TEXT,
  location_city TEXT,
  location_region TEXT,
  user_agent TEXT,
  is_blocked BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_by UUID REFERENCES admin_users(id),
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_device_sessions_device_id ON public.device_sessions(device_id);
CREATE INDEX idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX idx_device_sessions_is_blocked ON public.device_sessions(is_blocked);
CREATE INDEX idx_device_sessions_last_active ON public.device_sessions(last_active DESC);

-- Enable RLS
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Support staff can view all device sessions
CREATE POLICY "Support staff can view all devices"
  ON public.device_sessions
  FOR SELECT
  USING (true);

-- Support staff can update device sessions (for blocking)
CREATE POLICY "Support staff can update devices"
  ON public.device_sessions
  FOR UPDATE
  USING (true);

-- System can insert device sessions
CREATE POLICY "System can insert devices"
  ON public.device_sessions
  FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_device_sessions_updated_at
  BEFORE UPDATE ON public.device_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_device_sessions_updated_at();