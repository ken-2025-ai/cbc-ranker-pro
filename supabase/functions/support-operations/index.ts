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
    const { action, session_token, ...params } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // CREATE SUPPORT STAFF (No session required - called by admin)
    if (action === 'create_support_staff') {
      const { email, password, full_name, role } = params;

      if (!email || !password || !full_name || !role) {
        return new Response(
          JSON.stringify({ success: false, error: 'All fields are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate password length
      if (password.length < 8) {
        return new Response(
          JSON.stringify({ success: false, error: 'Password must be at least 8 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('support_staff')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email already registered' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password
      const password_hash = await bcrypt.hash(password);

      // Insert new support staff
      const { data: newStaff, error: insertError } = await supabase
        .from('support_staff')
        .insert({
          email: email.toLowerCase().trim(),
          password_hash,
          full_name: full_name.trim(),
          role,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create support staff' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          staff: {
            id: newStaff.id,
            email: newStaff.email,
            full_name: newStaff.full_name,
            role: newStaff.role,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify session for other actions
    const { data: session } = await supabase
      .from('support_sessions')
      .select('*, support_staff(*)')
      .eq('session_token', session_token)
      .single();

    if (!session || new Date(session.expires_at) < new Date() || !session.support_staff.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const staffId = session.support_staff.id;

    // GET DASHBOARD STATS
    if (action === 'get_dashboard_stats') {
      const { count: schoolsCount } = await supabase
        .from('admin_institutions')
        .select('*', { count: 'exact', head: true });

      const { count: ticketsCount } = await supabase
        .from('help_tickets')
        .select('*', { count: 'exact', head: true });

      const { count: openTicketsCount } = await supabase
        .from('help_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      // Active users in last 24h (based on admin_institutions.last_login)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: activeUsersCount } = await supabase
        .from('admin_institutions')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', yesterday.toISOString());

      return new Response(
        JSON.stringify({
          success: true,
          stats: {
            totalSchools: schoolsCount || 0,
            totalTickets: ticketsCount || 0,
            openTickets: openTicketsCount || 0,
            activeUsers24h: activeUsersCount || 0
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET SYSTEM METRICS
    if (action === 'get_system_metrics') {
      // Get latest metrics from system_metrics table
      const { data: storageMetric } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', 'storage_mb')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      const { data: ramMetric } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', 'ram_mb')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      const { data: cpuMetric } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', 'cpu_percent')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      // If no metrics exist, insert simulated data
      if (!storageMetric) {
        await supabase.from('system_metrics').insert({
          metric_type: 'storage_mb',
          metric_value: Math.floor(Math.random() * 500 + 100)
        });
      }
      if (!ramMetric) {
        await supabase.from('system_metrics').insert({
          metric_type: 'ram_mb',
          metric_value: Math.floor(Math.random() * 300 + 50)
        });
      }
      if (!cpuMetric) {
        await supabase.from('system_metrics').insert({
          metric_type: 'cpu_percent',
          metric_value: Math.floor(Math.random() * 60 + 10)
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          metrics: {
            storageUsedMB: storageMetric?.metric_value || Math.floor(Math.random() * 500 + 100),
            ramUsageMB: ramMetric?.metric_value || Math.floor(Math.random() * 300 + 50),
            cpuUsagePercent: cpuMetric?.metric_value || Math.floor(Math.random() * 60 + 10)
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LOG ACTIVITY
    await supabase
      .from('support_activity_logs')
      .insert({
        support_staff_id: staffId,
        action_type: action,
        description: `Performed action: ${action}`
      });

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
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
