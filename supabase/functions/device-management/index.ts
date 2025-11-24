import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, device_id, block_reason, session_token } = await req.json();

    console.log('Device management action:', action, 'for device:', device_id);

    // Verify support staff authentication
    if (action === 'block' || action === 'unblock') {
      const { data: session } = await supabase
        .from('support_sessions')
        .select('support_staff_id')
        .eq('session_token', session_token)
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'block') {
        const { error } = await supabase
          .from('device_sessions')
          .update({
            is_blocked: true,
            blocked_at: new Date().toISOString(),
            blocked_by: session.support_staff_id,
            block_reason: block_reason || 'Blocked by support staff'
          })
          .eq('device_id', device_id);

        if (error) {
          console.error('Error blocking device:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Device blocked successfully:', device_id);
        return new Response(
          JSON.stringify({ success: true, message: 'Device blocked successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'unblock') {
        const { error } = await supabase
          .from('device_sessions')
          .update({
            is_blocked: false,
            blocked_at: null,
            blocked_by: null,
            block_reason: null
          })
          .eq('device_id', device_id);

        if (error) {
          console.error('Error unblocking device:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Device unblocked successfully:', device_id);
        return new Response(
          JSON.stringify({ success: true, message: 'Device unblocked successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // List all devices
    if (action === 'list') {
      const { data: devices, error } = await supabase
        .from('device_sessions')
        .select(`
          *,
          institution:admin_institutions(name)
        `)
        .order('last_active', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, devices }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in device management:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
