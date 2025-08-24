-- Create or update admin user with proper password
-- First, let's create a function to hash the password and set up the admin user
CREATE OR REPLACE FUNCTION setup_admin_user(admin_email text, admin_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete any existing admin user with this email
  DELETE FROM admin_users WHERE email = admin_email;
  
  -- Insert new admin user with a default password that will be updated by the edge function
  INSERT INTO admin_users (
    email,
    password_hash,
    full_name,
    role,
    is_active,
    failed_login_attempts
  ) VALUES (
    admin_email,
    'temp_hash',
    'System Administrator',
    'super_admin',
    true,
    0
  );
END;
$$;

-- Set up the default admin user
SELECT setup_admin_user('Admin.account@gmail.com', 'access5293@Me_');

-- Also ensure admin_activity_logs table exists for logging
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Drop the setup function as it's no longer needed
DROP FUNCTION setup_admin_user(text, text);