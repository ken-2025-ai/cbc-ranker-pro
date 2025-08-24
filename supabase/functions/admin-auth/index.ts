import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { email, password, action, session_token } = body || {};

    if (action === 'login') {
      // Get admin user
      const { data: adminUser, error: getUserError } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (getUserError || !adminUser) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Check for too many failed attempts (lockout after 5 attempts)
      if (adminUser.failed_login_attempts >= 5) {
        const lockoutTime = new Date(adminUser.last_failed_login).getTime() + (30 * 60 * 1000); // 30 minutes
        if (Date.now() < lockoutTime) {
          return new Response(JSON.stringify({ error: 'Account locked due to too many failed attempts' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 423,
          });
        }
      }

      // Simple password verification for admin setup
      let isValidPassword = false;
      if (email === 'Admin.account@gmail.com' && password === 'access5293@Me_') {
        isValidPassword = true;
      } else if (adminUser.password_hash && adminUser.password_hash !== 'temp_hash') {
        // For now, just do a simple string comparison until we get proper hashing working
        isValidPassword = (password === adminUser.password_hash);
      }
      
      if (!isValidPassword) {
        // Increment failed login attempts
        await supabaseClient
          .from('admin_users')
          .update({
            failed_login_attempts: adminUser.failed_login_attempts + 1,
            last_failed_login: new Date().toISOString()
          })
          .eq('id', adminUser.id);

        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Reset failed login attempts on successful login
      await supabaseClient
        .from('admin_users')
        .update({
          failed_login_attempts: 0,
          last_failed_login: null
        })
        .eq('id', adminUser.id);

      // Create session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

      const { error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .insert({
          admin_id: adminUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      // Log admin activity
      const ipHeader = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || '127.0.0.1';
      const userAgent = req.headers.get('user-agent') || null;
      await supabaseClient
        .from('admin_activity_logs')
        .insert({
          admin_id: adminUser.id,
          action_type: 'login',
          description: `Admin ${adminUser.email} logged in`,
          ip_address: ipHeader,
          user_agent: userAgent
        });

      return new Response(JSON.stringify({
        user: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: adminUser.role
        },
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'verify_session') {
      const { data: session, error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .select(`
          *,
          admin_users (
            id,
            email,
            full_name,
            role,
            is_active
          )
        `)
        .eq('session_token', session_token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session || !session.admin_users.is_active) {
        return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      return new Response(JSON.stringify({
        user: session.admin_users,
        session_token: session.session_token,
        expires_at: session.expires_at
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'logout') {
      await supabaseClient
        .from('admin_sessions')
        .delete()
        .eq('session_token', session_token);

      return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});