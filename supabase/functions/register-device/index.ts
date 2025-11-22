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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      deviceId,
      deviceName,
      publicKey,
      institutionId,
      userId,
    } = await req.json();

    // Check if device already registered
    const { data: existing } = await supabase
      .from('exam_devices')
      .select('*')
      .eq('device_id', deviceId)
      .eq('institution_id', institutionId)
      .single();

    if (existing) {
      // Update last active
      const { error: updateError } = await supabase
        .from('exam_devices')
        .update({ last_active: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating device:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          deviceId: existing.id,
          message: 'Device already registered' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register new device
    const { data, error } = await supabase
      .from('exam_devices')
      .insert({
        device_id: deviceId,
        device_name: deviceName,
        public_key: publicKey,
        institution_id: institutionId,
        user_id: userId,
        registered_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering device:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Device registered:', deviceId);

    return new Response(
      JSON.stringify({ success: true, deviceId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
