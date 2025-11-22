import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { action, ticketId, updates } = await req.json();

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different actions
    if (action === 'fetch_all') {
      // Fetch all help tickets
      const { data, error } = await supabase
        .from('help_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch tickets', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, tickets: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    else if (action === 'update_status') {
      // Update ticket status
      if (!ticketId || !updates || !updates.status) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: ticketId and status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: any = { status: updates.status, updated_at: new Date().toISOString() };
      
      // Add resolved_at if status is resolved
      if (updates.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('help_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket status:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update ticket status', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Ticket ${ticketId} status updated to ${updates.status}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Ticket status updated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    else if (action === 'update_priority') {
      // Update ticket priority
      if (!ticketId || !updates || !updates.priority) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: ticketId and priority' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('help_tickets')
        .update({ priority: updates.priority, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket priority:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update ticket priority', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Ticket ${ticketId} priority updated to ${updates.priority}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Ticket priority updated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Supported actions: fetch_all, update_status, update_priority' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});