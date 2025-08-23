-- Set the password hash for the admin user
-- We'll call the edge function to properly hash the password

-- First, ensure the admin user exists with correct details
INSERT INTO admin_users (email, full_name, role, is_active, password_hash)
VALUES ('Admin.account@gmail.com', 'System Administrator', 'super_admin', true, 'temp_hash')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- The password will be set via the edge function call below