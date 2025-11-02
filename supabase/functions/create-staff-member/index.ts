import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin/owner
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is institution owner
    const { data: institution, error: instError } = await supabaseAdmin
      .from('admin_institutions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (instError || !institution) {
      throw new Error('User is not an institution owner');
    }

    const { 
      email, 
      password, 
      full_name, 
      phone_number, 
      role, 
      assigned_classes 
    } = await req.json();

    // Validation
    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    // ACID Transaction: Create auth user first
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
      }
    });

    if (authError2) {
      console.error('Auth creation error:', authError2);
      throw new Error(`Failed to create user account: ${authError2.message}`);
    }

    try {
      // ACID Transaction: Create staff record
      const { error: staffError } = await supabaseAdmin
        .from('institution_staff')
        .insert({
          institution_id: institution.id,
          user_id: authData.user.id,
          full_name: full_name.trim(),
          email: email.trim(),
          phone_number: phone_number?.trim() || null,
          role: role,
          assigned_classes: assigned_classes && assigned_classes.length > 0 ? assigned_classes : null,
          created_by: user.id,
        });

      if (staffError) {
        // Rollback: Delete auth user if staff creation failed
        console.error('Staff creation error:', staffError);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create staff record: ${staffError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Staff member created successfully',
          user_id: authData.user.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (error) {
      // Cleanup on any error
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in create-staff-member function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
