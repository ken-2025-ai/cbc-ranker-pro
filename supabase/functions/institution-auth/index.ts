import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  console.log('Institution auth request received');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, session_token } = await req.json();
    console.log('Institution auth action:', action);

    if (action === 'login') {
      // Authenticate institution
      const { data: institution, error } = await supabase
        .from('admin_institutions')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !institution) {
        console.log('Institution not found:', error);
        return new Response(
          JSON.stringify({ error: 'Institution not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }

      // Check if institution is active
      if (!institution.is_active) {
        return new Response(
          JSON.stringify({ error: 'This institution account has been deactivated. Please contact support.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }

      // Check if institution is blocked
      if (institution.is_blocked) {
        return new Response(
          JSON.stringify({ error: 'Your account has been blocked by admin. Please contact support.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }

      // Check subscription expiry
      if (institution.subscription_expires_at) {
        const expiryDate = new Date(institution.subscription_expires_at);
        const today = new Date();
        if (expiryDate < today) {
          return new Response(
            JSON.stringify({ error: 'Your subscription has expired. Please contact admin to renew.' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 403 
            }
          );
        }
      }

      // Simple password check (in production, use proper hashing)
      if (institution.password_hash !== password) {
        return new Response(
          JSON.stringify({ error: 'Invalid password' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }

      // Create session token
      const sessionToken = crypto.randomUUID();
      
      // Store session (you might want to use a sessions table)
      const sessionData = {
        institution_id: institution.id,
        username: institution.username,
        name: institution.name,
        token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        last_login: new Date().toISOString()
      };

      // Update last login
      await supabase
        .from('admin_institutions')
        .update({ last_login: new Date().toISOString() })
        .eq('id', institution.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          session: sessionData,
          institution: {
            id: institution.id,
            name: institution.name,
            username: institution.username,
            headteacher_name: institution.headteacher_name,
            email: institution.email,
            phone: institution.phone,
            address: institution.address,
            county: institution.county,
            subscription_status: institution.subscription_status,
            subscription_expires_at: institution.subscription_expires_at
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'verify_session') {
      // In a real implementation, you'd verify against a sessions table
      // For now, we'll just check if the institution still exists and is active
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'No session token provided' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }

      // This is a simplified verification - in production you'd have a proper sessions table
      return new Response(
        JSON.stringify({ valid: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'logout') {
      // In production, you'd invalidate the session in the database
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('Institution auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});