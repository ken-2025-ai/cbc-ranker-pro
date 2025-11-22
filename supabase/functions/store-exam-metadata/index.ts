import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      examId,
      schoolId,
      class: classLevel,
      subject,
      examType,
      teacherId,
      teacherName,
      version,
      totalMarks,
      timeAllowed,
      questionCount,
      strands,
      difficulty,
    } = await req.json();

    // Store only metadata - no exam content
    const { data, error } = await supabase
      .from('exams')
      .insert({
        id: examId,
        institution_id: schoolId,
        class_level: classLevel,
        subject,
        exam_type: examType,
        owner_id: teacherId,
        total_marks: totalMarks,
        time_allowed_minutes: timeAllowed,
        question_count: questionCount,
        strands,
        difficulty,
        status: 'encrypted',
        school_name: teacherName, // Using this field to store teacher name temporarily
        ai_metadata: {
          version,
          distributed: false,
          devices: [],
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing exam metadata:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Exam metadata stored:', examId);

    return new Response(
      JSON.stringify({ success: true, examId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
