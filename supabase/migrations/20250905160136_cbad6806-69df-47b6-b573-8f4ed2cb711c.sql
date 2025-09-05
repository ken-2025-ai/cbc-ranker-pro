-- Add user_id column to admin_institutions to link with Supabase auth
ALTER TABLE admin_institutions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_admin_institutions_user_id ON admin_institutions(user_id);

-- Update existing institutions to have a corresponding auth user
-- Note: This is for institutions that already exist but don't have auth users yet