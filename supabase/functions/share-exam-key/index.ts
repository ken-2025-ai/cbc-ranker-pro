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
      examId,
      targetDeviceId,
      encryptedKey,
      fromDeviceId,
    } = await req.json();

    // Verify both devices belong to same institution
    const { data: devices, error: deviceError } = await supabase
      .from('exam_devices')
      .select('institution_id')
      .in('device_id', [fromDeviceId, targetDeviceId]);

    if (deviceError || !devices || devices.length !== 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid devices' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (devices[0].institution_id !== devices[1].institution_id) {
      return new Response(
        JSON.stringify({ error: 'Devices must be in same institution' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store encrypted key for target device
    const { data, error } = await supabase
      .from('exam_device_keys')
      .insert({
        exam_id: examId,
        device_id: targetDeviceId,
        encrypted_key: encryptedKey,
        shared_by: fromDeviceId,
        shared_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing exam key:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Exam key shared:', examId, 'to device:', targetDeviceId);

    return new Response(
      JSON.stringify({ success: true, keyId: data.id }),
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
