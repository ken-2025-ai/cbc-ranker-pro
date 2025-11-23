-- Enable RLS on user_notifications (if not already enabled)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "System can insert notifications" ON user_notifications;

-- Create INSERT policy for service role and authenticated users
CREATE POLICY "System can insert notifications"
ON user_notifications
FOR INSERT
TO public
WITH CHECK (true);

-- Enable realtime for user_notifications table
ALTER TABLE user_notifications REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
DO $$
BEGIN
  -- Check if publication exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  -- Add table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
  END IF;
END $$;