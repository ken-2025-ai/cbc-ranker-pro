-- Drop existing function first
DROP FUNCTION IF EXISTS public.run_scheduled_cleanup();

-- Recreate the run_scheduled_cleanup function with correct return type
CREATE OR REPLACE FUNCTION public.run_scheduled_cleanup()
RETURNS TABLE(table_name text, rows_deleted bigint, execution_time timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cd.table_name,
    cd.rows_deleted,
    now() as execution_time
  FROM cleanup_expired_data() cd;
END;
$function$;

-- Create cleanup history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cleanup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleanup_timestamp timestamptz DEFAULT now(),
  tables_cleaned jsonb,
  total_rows_deleted bigint,
  execution_duration_ms integer
);

-- Enable RLS on cleanup_history
ALTER TABLE public.cleanup_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin users can view cleanup history" ON public.cleanup_history;

-- Create policy for admin users to view cleanup history (fixed UUID comparison)
CREATE POLICY "Admin users can view cleanup history"
ON public.cleanup_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = auth.uid()::text
  )
);

-- Create the run_tracked_cleanup function
CREATE OR REPLACE FUNCTION public.run_tracked_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  start_time timestamptz;
  end_time timestamptz;
  duration_ms integer;
  cleanup_results jsonb;
  total_deleted bigint := 0;
BEGIN
  start_time := clock_timestamp();
  
  -- Run cleanup and collect results
  WITH cleanup_data AS (
    SELECT * FROM cleanup_expired_data()
  )
  SELECT 
    jsonb_agg(jsonb_build_object(
      'table', table_name,
      'rows_deleted', rows_deleted
    )),
    COALESCE(sum(rows_deleted), 0)
  INTO cleanup_results, total_deleted
  FROM cleanup_data;
  
  end_time := clock_timestamp();
  duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::integer;
  
  -- Store history
  INSERT INTO public.cleanup_history (tables_cleaned, total_rows_deleted, execution_duration_ms)
  VALUES (cleanup_results, total_deleted, duration_ms);
  
  RETURN jsonb_build_object(
    'timestamp', now(),
    'tables_cleaned', COALESCE(cleanup_results, '[]'::jsonb),
    'total_rows_deleted', total_deleted,
    'duration_ms', duration_ms,
    'success', true
  );
END;
$function$;