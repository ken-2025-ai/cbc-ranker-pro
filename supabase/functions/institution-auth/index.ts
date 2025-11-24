import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Password verification using Web Crypto API
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const { salt: saltArray, hash: storedHashArray } = JSON.parse(storedHash);
    const encoder = new TextEncoder();
    const salt = new Uint8Array(saltArray);
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    
    const exportedKey = await crypto.subtle.exportKey("raw", key);
    const hashArray = Array.from(new Uint8Array(exportedKey));
    
    return JSON.stringify(hashArray) === JSON.stringify(storedHashArray);
  } catch {
    return false;
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  console.log('Institution auth request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, username, password, session_token } = await req.json();
    console.log('Institution auth action:', action);

    if (action === 'login') {
      const { data: institution, error } = await supabase
        .from('admin_institutions')
        .select('*')
        .eq('username', username)
        .maybeSingle();

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

      if (!institution.is_active) {
        return new Response(
          JSON.stringify({ error: 'This institution account has been deactivated. Please contact support.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }

      if (institution.is_blocked) {
        return new Response(
          JSON.stringify({ error: 'Your account has been blocked by admin. Please contact support.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }

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

      // Track device session
      const deviceInfo = req.headers.get('user-agent') || 'Unknown';
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '127.0.0.1';
      const deviceId = `${institution.id}_${deviceInfo}_${ipAddress}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 255);
      
      // Check if device is blocked
      const { data: blockedDevice } = await supabase
        .from('device_sessions')
        .select('id, is_blocked')
        .eq('device_id', deviceId)
        .eq('is_blocked', true)
        .maybeSingle();

      if (blockedDevice) {
        return new Response(
          JSON.stringify({ error: 'This device has been blocked from accessing the system' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, institution.password_hash);
      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid password' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }

      // Update or create device session
      const deviceType = deviceInfo.toLowerCase().includes('mobile') ? 'mobile' : 
                        deviceInfo.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';
      
      await supabase.from('device_sessions').upsert({
        device_id: deviceId,
        device_name: deviceInfo,
        device_type: deviceType,
        user_id: institution.user_id,
        user_type: 'institution',
        institution_id: institution.id,
        ip_address: ipAddress,
        user_agent: deviceInfo,
        last_active: new Date().toISOString()
      }, { onConflict: 'device_id' });

      // Create session token
      const sessionToken = crypto.randomUUID();
      
      const sessionData = {
        institution_id: institution.id,
        username: institution.username,
        name: institution.name,
        token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date().toISOString()
      };

      await supabase
        .from('admin_institutions')
        .update({ last_login: new Date().toISOString() })
        .eq('id', institution.id);

      const upsertPayload = {
        id: institution.id,
        name: institution.name,
        email: institution.email || null,
        code: institution.username,
        address: institution.address || null,
        phone: institution.phone || null,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('institutions')
        .upsert(upsertPayload, { onConflict: 'id' });

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
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'No session token provided' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'logout') {
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