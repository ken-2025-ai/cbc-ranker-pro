import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting scheduled cleanup job...');

    // Run cleanup function
    const { data: cleanupResults, error: cleanupError } = await supabase
      .rpc('run_scheduled_cleanup');

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
      throw cleanupError;
    }

    console.log('Cleanup results:', cleanupResults);

    // Check for exam periods that need backup
    const { data: examPeriods, error: examError } = await supabase
      .from('exam_periods')
      .select('id, name, institution_id, archived_at')
      .eq('is_active', false)
      .eq('backup_sent', false)
      .not('archived_at', 'is', null);

    if (examError) {
      console.error('Error fetching exam periods:', examError);
      throw examError;
    }

    console.log(`Found ${examPeriods?.length || 0} exam periods needing backup`);

    // Trigger backup notifications for each exam period
    if (examPeriods && examPeriods.length > 0) {
      for (const period of examPeriods) {
        console.log(`Triggering backup for exam period: ${period.name}`);
        
        // Call backup notification function
        const backupResponse = await fetch(`${supabaseUrl}/functions/v1/backup-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exam_period_id: period.id,
            institution_id: period.institution_id,
          }),
        });

        if (!backupResponse.ok) {
          console.error(`Failed to trigger backup for ${period.name}`);
        }
      }
    }

    const summary = {
      cleanup_executed: true,
      records_cleaned: cleanupResults,
      exam_periods_backed_up: examPeriods?.length || 0,
      timestamp: new Date().toISOString(),
    };

    console.log('Cleanup job completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in scheduled cleanup:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
