import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, session_token } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // LOGIN
    if (action === 'login') {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch support staff
      const { data: staff, error: fetchError } = await supabase
        .from('support_staff')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (fetchError || !staff) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!staff.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: 'Account is deactivated' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password
      const isValid = await bcrypt.compare(password, staff.password_hash);
      if (!isValid) {
        // Update failed login attempts
        await supabase
          .from('support_staff')
          .update({
            failed_login_attempts: (staff.failed_login_attempts || 0) + 1,
            last_failed_login: new Date().toISOString()
          })
          .eq('id', staff.id);

        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

      // Create session
      await supabase
        .from('support_sessions')
        .insert({
          support_staff_id: staff.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      // Update last login and reset failed attempts
      await supabase
        .from('support_staff')
        .update({
          last_login: new Date().toISOString(),
          failed_login_attempts: 0
        })
        .eq('id', staff.id);

      // Log activity
      await supabase
        .from('support_activity_logs')
        .insert({
          support_staff_id: staff.id,
          action_type: 'login',
          description: 'Support staff logged in'
        });

      return new Response(
        JSON.stringify({
          success: true,
          session_token: sessionToken,
          staff: {
            id: staff.id,
            email: staff.email,
            full_name: staff.full_name,
            role: staff.role
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VERIFY SESSION
    if (action === 'verify_session') {
      if (!session_token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Session token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session, error: sessionError } = await supabase
        .from('support_sessions')
        .select('*, support_staff(*)')
        .eq('session_token', session_token)
        .single();

      if (sessionError || !session || new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const staff = session.support_staff;
      if (!staff.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: 'Account is deactivated' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          staff: {
            id: staff.id,
            email: staff.email,
            full_name: staff.full_name,
            role: staff.role
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LOGOUT
    if (action === 'logout') {
      if (session_token) {
        await supabase
          .from('support_sessions')
          .delete()
          .eq('session_token', session_token);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
