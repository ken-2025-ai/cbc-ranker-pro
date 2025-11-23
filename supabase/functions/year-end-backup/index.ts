import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  institution_id: string;
  institution_email?: string;
  institution_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { institution_id, institution_email, institution_name }: BackupRequest = await req.json();

    console.log(`Starting backup for institution: ${institution_id}`);

    // Fetch all data to backup
    const [studentsRes, marksRes, examPeriodsRes, examsRes] = await Promise.all([
      supabase.from('students').select('*').eq('institution_id', institution_id),
      supabase.from('marks').select('*, students(full_name, admission_number), subjects(name), exam_periods(name, term, year)')
        .eq('students.institution_id', institution_id),
      supabase.from('exam_periods').select('*').eq('institution_id', institution_id),
      supabase.from('exams').select('*').eq('institution_id', institution_id),
    ]);

    if (studentsRes.error) throw studentsRes.error;
    if (marksRes.error) throw marksRes.error;
    if (examPeriodsRes.error) throw examPeriodsRes.error;
    if (examsRes.error) throw examsRes.error;

    const backupData = {
      institution_id,
      institution_name: institution_name || 'Unknown Institution',
      backup_date: new Date().toISOString(),
      academic_year: new Date().getFullYear(),
      data: {
        students: studentsRes.data || [],
        marks: marksRes.data || [],
        exam_periods: examPeriodsRes.data || [],
        exams: examsRes.data || [],
      },
      statistics: {
        total_students: studentsRes.data?.length || 0,
        total_marks: marksRes.data?.length || 0,
        total_exam_periods: examPeriodsRes.data?.length || 0,
        total_exams: examsRes.data?.length || 0,
      },
    };

    console.log('Backup data prepared:', backupData.statistics);

    // Send email backup if email provided and Resend is configured
    let emailSent = false;
    if (institution_email && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const backupJson = JSON.stringify(backupData, null, 2);
        const backupBuffer = new TextEncoder().encode(backupJson);
        const base64Data = btoa(String.fromCharCode(...backupBuffer));

        await resend.emails.send({
          from: "CBC Pro Ranker <onboarding@resend.dev>",
          to: [institution_email],
          subject: `Year-End Data Backup - ${institution_name || institution_id}`,
          html: `
            <h1>Year-End Data Backup</h1>
            <p>Your annual data backup has been created successfully.</p>
            <h2>Backup Summary:</h2>
            <ul>
              <li>Students: ${backupData.statistics.total_students}</li>
              <li>Marks: ${backupData.statistics.total_marks}</li>
              <li>Exam Periods: ${backupData.statistics.total_exam_periods}</li>
              <li>Exams: ${backupData.statistics.total_exams}</li>
            </ul>
            <p>The backup file is attached to this email.</p>
            <p><strong>Important:</strong> Store this backup securely. All exam data will be removed from the server after promotion.</p>
          `,
          attachments: [
            {
              filename: `backup-${institution_id}-${new Date().toISOString().split('T')[0]}.json`,
              content: base64Data,
            },
          ],
        });
        emailSent = true;
        console.log('Email backup sent successfully');
      } catch (emailError) {
        console.error('Failed to send email backup:', emailError);
        // Continue even if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        backup: backupData,
        emailSent,
        message: emailSent ? 'Backup created and emailed successfully' : 'Backup created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in year-end-backup:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
