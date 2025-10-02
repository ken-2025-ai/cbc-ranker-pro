import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  console.log('Institution signup request received');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, institutionCode } = await req.json();
    console.log('Institution signup request for:', email, 'with code:', institutionCode);

    // First, find the institution by username (institution code)
    const { data: institution, error: instError } = await supabase
      .from('admin_institutions')
      .select('*')
      .eq('username', institutionCode)
      .is('user_id', null) // Only institutions not linked to a user yet - FIXED: use .is() instead of .eq()
      .maybeSingle();

    if (instError) {
      console.log('Database error fetching institution:', instError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error. Please try again.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!institution) {
      console.log('Institution not found or already linked for code:', institutionCode);
      return new Response(
        JSON.stringify({ 
          error: 'Institution code not found or already has an account. Please verify your institution code with your administrator.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
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
        JSON.stringify({ error: 'Your institution has been blocked by admin. Please contact support.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    // Check subscription status for paid institutions
    if (institution.subscription_status !== 'paid' && institution.subscription_status !== 'trial') {
      return new Response(
        JSON.stringify({ 
          error: 'Your institution subscription is not active. Please contact your administrator or make payment to activate your account.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let authUserId: string;
    
    if (existingUser) {
      // User already exists - just link them to the institution
      console.log('Existing user found, linking to institution:', email);
      authUserId = existingUser.id;
      
      // Update user metadata
      await supabase.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          institution_id: institution.id,
          institution_name: institution.name,
          institution_username: institution.username
        }
      });
    } else {
      // Create new Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm for institutions that have paid
        user_metadata: {
          institution_id: institution.id,
          institution_name: institution.name,
          institution_username: institution.username
        }
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return new Response(
          JSON.stringify({ 
            error: authError?.message || 'Failed to create user account' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      authUserId = authData.user.id;
    }

    // Link the institution to the auth user
    const { error: updateError } = await supabase
      .from('admin_institutions')
      .update({ 
        user_id: authUserId,
        email: email, // Update email if it wasn't set
        last_login: new Date().toISOString()
      })
      .eq('id', institution.id);

    if (updateError) {
      console.error('Error linking institution to user:', updateError);
      
      // Clean up the created user if linking failed (only if we just created them)
      if (!existingUser) {
        await supabase.auth.admin.deleteUser(authUserId);
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to link institution account' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Create or update profile for the institution user
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authUserId,
        username: institution.username,
        institution_id: institution.id,
        role: 'admin' // Institution admin role
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
    }

    // Ensure a corresponding row exists in public.institutions for FK integrity
    const upsertPayload = {
      id: institution.id,
      name: institution.name,
      email: institution.email || email,
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
        message: existingUser ? 'Institution linked successfully. You can now sign in.' : 'Account created successfully. You can now sign in.',
        institution: {
          id: institution.id,
          name: institution.name,
          username: institution.username,
          email: email
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Institution signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});