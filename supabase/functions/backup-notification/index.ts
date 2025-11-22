import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exam_period_id, institution_id } = await req.json();

    if (!exam_period_id || !institution_id) {
      throw new Error('exam_period_id and institution_id are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    console.log(`Processing backup for exam period: ${exam_period_id}`);

    // Get exam period details
    const { data: examPeriod, error: periodError } = await supabase
      .from('exam_periods')
      .select('name, term, year')
      .eq('id', exam_period_id)
      .single();

    if (periodError) throw periodError;

    // Get institution details
    const { data: institution, error: instError } = await supabase
      .from('admin_institutions')
      .select('name, email, headteacher_name')
      .eq('id', institution_id)
      .single();

    if (instError) throw instError;

    // Archive the term data (backs up to marks table)
    const { data: archiveResult, error: archiveError } = await supabase
      .rpc('archive_term_data', { p_exam_period_id: exam_period_id });

    if (archiveError) {
      console.error('Archive error:', archiveError);
      throw archiveError;
    }

    console.log('Archive completed:', archiveResult);

    // Log the backup
    const { error: logError } = await supabase
      .from('backup_logs')
      .insert({
        institution_id,
        exam_period_id,
        backup_type: 'automatic',
        status: 'completed',
        recipient_email: institution.email,
        file_size_bytes: archiveResult.marks_deleted * 100, // Rough estimate
      });

    if (logError) {
      console.error('Error logging backup:', logError);
    }

    // Mark backup as sent
    await supabase
      .from('exam_periods')
      .update({ backup_sent: true })
      .eq('id', exam_period_id);

    // Send email notification if Resend is configured
    if (resend && institution.email) {
      try {
        await resend.emails.send({
          from: 'CBC Pro Ranker <notifications@resend.dev>',
          to: [institution.email],
          subject: `Data Backup Completed - ${examPeriod.name}`,
          html: `
            <h2>Backup Notification</h2>
            <p>Dear ${institution.headteacher_name || 'Administrator'},</p>
            <p>The data for <strong>${examPeriod.name}</strong> (Term ${examPeriod.term}, ${examPeriod.year}) has been successfully archived.</p>
            <h3>Backup Summary:</h3>
            <ul>
              <li>Institution: ${institution.name}</li>
              <li>Exam Period: ${examPeriod.name}</li>
              <li>Marks Archived: ${archiveResult.marks_deleted}</li>
              <li>Rankings Cleared: ${archiveResult.rankings_deleted}</li>
              <li>Date: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>Your data is safely stored in the permanent marks table and will be available for historical reporting.</p>
            <p><strong>Note:</strong> Active marks have been moved to the permanent storage. The system will continue to use optimized temporary storage for current term data.</p>
            <br>
            <p>Best regards,<br>CBC Pro Ranker Team</p>
          `,
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't throw - backup succeeded even if email failed
      }
    }

    const response = {
      success: true,
      exam_period: examPeriod.name,
      institution: institution.name,
      marks_archived: archiveResult.marks_deleted,
      rankings_cleared: archiveResult.rankings_deleted,
      email_sent: !!resend,
      timestamp: new Date().toISOString(),
    };

    console.log('Backup notification completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in backup notification:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
