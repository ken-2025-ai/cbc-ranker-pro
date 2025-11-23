-- ============================================
-- FIX: DataCleanup "Run Cleanup" Button Errors
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Link: https://supabase.com/dashboard/project/tzdpqwkbkuqypzzuphmt/sql/new

-- Fix the run_scheduled_cleanup function to match cleanup_expired_data output
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

-- Verify the fix
SELECT * FROM run_scheduled_cleanup();

-- Additional: Add cache cleanup tracking
CREATE TABLE IF NOT EXISTS public.cleanup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleanup_timestamp timestamptz DEFAULT now(),
  tables_cleaned jsonb,
  total_rows_deleted bigint,
  execution_duration_ms integer
);

-- Enhanced cleanup function with tracking
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
    sum(rows_deleted)
  INTO cleanup_results, total_deleted
  FROM cleanup_data;
  
  end_time := clock_timestamp();
  duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::integer;
  
  -- Store history
  INSERT INTO public.cleanup_history (tables_cleaned, total_rows_deleted, execution_duration_ms)
  VALUES (cleanup_results, total_deleted, duration_ms);
  
  RETURN jsonb_build_object(
    'timestamp', now(),
    'tables_cleaned', cleanup_results,
    'total_rows_deleted', total_deleted,
    'duration_ms', duration_ms,
    'success', true
  );
END;
$function$;

-- Test the new function
SELECT run_tracked_cleanup();

-- View cleanup history
SELECT 
  cleanup_timestamp,
  total_rows_deleted,
  execution_duration_ms,
  tables_cleaned
FROM public.cleanup_history
ORDER BY cleanup_timestamp DESC
LIMIT 10;
