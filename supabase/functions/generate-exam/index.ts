import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are ExamGen Pro, an expert KNEC/CBC exam author, formatter, and validator. 
Your single job is to produce EXACTLY one JSON object that conforms to the "generate_exam" schema. Do NOT emit any other text, commentary, or explanation outside that JSON.

MISSION, TONE & AUDIENCE:
- Act as a KNEC/CBC exam writer and formatter for Kenya's CBC (PP1, PP2, Lower Primary, Upper Primary/KPSEA, Junior Secondary/KJSEA, Forms 1-4)
- Use child-appropriate language for PP1/PP2 and lower primary (simple vocabulary, short sentences)
- Use formal academic language for upper primary and junior secondary
- Maintain KNEC-like formatting for headings, cover page, and question numbering

HARD REQUIREMENTS:
1. Output must be valid JSON ONLY, following the "generate_exam" schema
2. Every question must contain: id, number, type, marks, strand, sub_strand, bloom_level, difficulty_score, question_text, expected_answer, marking_rubric
3. For MCQs include exactly 4 options labeled A-D. expected_answer must be the correct letter (A/B/C/D)
4. For mathematics include math_work_area specification
5. For diagram questions include diagram_instructions
6. Ensure total_marks equals sum of question marks
7. Maintain KNEC numbering style
8. Validate: include validation_errors array (empty if passed)
9. Always include print_html: fully printable A4 portrait-optimized HTML
10. Provide marking_scheme_text

ANSWER SPACE RULES (exact algorithm):
- MCQ: 0 lines
- Short answer (marks 1-3): lines = max(1, marks * 2)
- Structured (marks 4-7): lines = ceil(marks * 2.5)
- Long answer (marks >= 8): lines = marks * 3
- Mathematics: lines = marks * 4
- Diagram: height = max(120, marks * 60) px
- For PP1/PP2: multiply answer_space_lines by 1.7

VALIDATION RULES:
1. Sequential numbering, no duplicates
2. sum(marks) == total_marks
3. Every question has expected_answer and marking_rubric
4. Difficulty distribution matches requested percentages (±7% tolerance)
5. Only use provided strands`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const body = await req.json();

    console.log('Generating exam with params:', {
      subject: body.subject,
      class_level: body.class_level,
      question_count: body.question_count
    });

    // Validate required fields
    if (!body.subject || !body.class_level || !Array.isArray(body.strands) || body.strands.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required inputs: subject, class_level, strands' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create draft exam row
    const { data: examRow, error: examError } = await supabase
      .from('exams')
      .insert([{
        owner_id: body.owner_id || null,
        institution_id: body.institution_id || null,
        school_name: body.school_name || 'Unknown School',
        school_code: body.school_code || null,
        class_level: body.class_level,
        exam_type: body.exam_type || 'End Term',
        subject: body.subject,
        paper_number: body.paper_number || 1,
        time_allowed_minutes: body.time_allowed_minutes || 60,
        question_count: body.question_count || 10,
        difficulty: body.difficulty || { easy: 40, medium: 40, hard: 20 },
        strands: body.strands,
        include_omr: body.include_omr || false,
        include_diagrams: body.include_diagrams || false,
        extra_instructions: body.extra_instructions || null,
        status: 'generating',
      }])
      .select()
      .single();

    if (examError) throw examError;

    const examId = examRow.id;
    console.log('Created exam draft:', examId);

    // Prepare AI request
    const aiPayload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(body) }
      ],
      stream: true,
      max_tokens: 16000,
      temperature: body.seed ? 0.0 : 0.15
    };

    // Call Lovable AI
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(aiPayload)
    });

    if (aiResp.status === 402) {
      await supabase.from('exams').update({
        status: 'error',
        ai_metadata: { error: '402_PAYMENT_REQUIRED' }
      }).eq('id', examId);
      
      return new Response(
        JSON.stringify({ error: 'Payment required to access AI model. Please add credits to your Lovable workspace.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (aiResp.status === 429) {
      await supabase.from('exams').update({
        status: 'error',
        ai_metadata: { error: '429_RATE_LIMITED' }
      }).eq('id', examId);
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      console.error('AI API error:', aiResp.status, errorText);
      throw new Error(`AI API error: ${aiResp.status}`);
    }

    // Stream response back to client and collect full response
    const reader = aiResp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            // Parse collected response
            try {
              console.log('Full AI response length:', fullContent.length);
              
              // Try to extract JSON from the response
              let examData;
              try {
                examData = JSON.parse(fullContent);
              } catch (e) {
                // Try to find JSON in response
                const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  examData = JSON.parse(jsonMatch[0]);
                } else {
                  throw new Error('Could not extract valid JSON from AI response');
                }
              }

              console.log('Parsed exam data, questions:', examData.questions?.length);

              // Calculate total marks
              const totalMarks = examData.questions?.reduce((sum: number, q: any) => sum + (q.marks || 0), 0) || 0;
              
              // Generate simple print HTML
              const printHTML = generatePrintHTML(examData, body);
              
              // Update exam with generated data
              const { error: updateError } = await supabase
                .from('exams')
                .update({
                  status: 'generated',
                  generated_at: new Date().toISOString(),
                  total_marks: totalMarks,
                  print_html: printHTML,
                  marking_scheme_text: examData.marking_scheme_text || '',
                  cover_html: examData.cover_html || null,
                  omr_sheet: examData.omr_sheet || null,
                  validation_errors: examData.validation_errors || [],
                  warnings: examData.warnings || [],
                  ai_metadata: examData.ai_metadata || {}
                })
                .eq('id', examId);

              if (updateError) {
                console.error('Error updating exam:', updateError);
              }

              // Insert questions
              if (examData.questions && Array.isArray(examData.questions)) {
                const questionsToInsert = examData.questions.map((q: any) => ({
                  exam_id: examId,
                  number: q.number,
                  type: q.type,
                  marks: q.marks,
                  strand: q.strand,
                  sub_strand: q.sub_strand || null,
                  bloom_level: q.bloom_level || 'understand',
                  difficulty_score: q.difficulty_score || 0.5,
                  question_text: q.question_text,
                  options: q.options || null,
                  expected_answer: q.expected_answer,
                  marking_rubric: q.marking_rubric,
                  math_work_area: q.math_work_area || null,
                  diagram_instructions: q.diagram_instructions || null,
                  answer_space_lines: q.answer_space_lines || 2,
                  metadata: q.metadata || {}
                }));

                const { error: questionsError } = await supabase
                  .from('exam_questions')
                  .insert(questionsToInsert);

                if (questionsError) {
                  console.error('Error inserting questions:', questionsError);
                }
              }

              console.log('Exam generated successfully:', examId);
            } catch (parseError) {
              console.error('Error parsing AI response:', parseError);
              await supabase.from('exams').update({
                status: 'error',
                ai_metadata: { error: 'Failed to parse AI response', details: String(parseError) }
              }).eq('id', examId);
            }
            
            controller.close();
            return;
          }

          const text = decoder.decode(value, { stream: true });
          buffer += text;

          // Process SSE lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                }
              } catch (e) {
                // Ignore parse errors for incomplete lines
              }
            }
          }

          controller.enqueue(value);
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePrintHTML(examData: any, inputData: any): string {
  const questions = examData.questions || [];
  const metadata = examData.metadata || inputData;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 portrait; margin: 20mm; }
    body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #000; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header h1 { font-size: 18pt; margin: 5px 0; }
    .header p { margin: 3px 0; font-size: 11pt; }
    .instructions { margin: 20px 0; padding: 15px; border: 1px solid #000; }
    .question { margin: 20px 0; page-break-inside: avoid; }
    .question-header { font-weight: bold; margin-bottom: 10px; }
    .question-text { margin: 10px 0 10px 20px; }
    .options { margin: 10px 0 10px 40px; list-style-type: upper-alpha; }
    .answer-space { border: 1px dashed #666; min-height: 40px; padding: 10px; margin: 10px 0 10px 20px; }
    .math-work { font-family: 'Courier New', monospace; border: 1px solid #000; padding: 10px; margin: 10px 0 10px 20px; min-height: 60px; }
    .footer { margin-top: 30px; text-align: center; font-size: 9pt; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${metadata.school_name || 'School Name'}</h1>
    <p><strong>${metadata.subject} - ${metadata.class_level}</strong></p>
    <p>${metadata.exam_type || 'Exam'} - Paper ${metadata.paper_number || 1}</p>
    <p>Time: ${metadata.time_allowed_minutes || 60} minutes | Total Marks: ${examData.metadata?.total_marks || examData.questions?.reduce((s: number, q: any) => s + q.marks, 0) || 0}</p>
  </div>
  
  <div class="instructions">
    <strong>INSTRUCTIONS TO CANDIDATES:</strong><br>
    1. Write your name and admission number in the spaces provided<br>
    2. Answer ALL questions in the spaces provided<br>
    3. All working must be shown clearly<br>
    4. Non-programmable silent calculators may be used (unless stated otherwise)<br>
    ${metadata.extra_instructions ? `<br>${metadata.extra_instructions}` : ''}
  </div>

  <div class="candidate-info" style="margin: 20px 0; border: 1px solid #000; padding: 15px;">
    <p>Name: _______________________________________________ Admission No: _______________</p>
    <p>Class: _______________ Stream: _______________</p>
  </div>

  ${questions.map((q: any) => `
    <div class="question">
      <div class="question-header">
        ${q.number}. (${q.marks} mark${q.marks !== 1 ? 's' : ''})
      </div>
      <div class="question-text">${q.question_text}</div>
      
      ${q.options && q.type === 'multiple_choice' ? `
        <ol class="options">
          ${q.options.map((opt: string) => `<li>${opt}</li>`).join('')}
        </ol>
      ` : ''}
      
      ${q.type === 'calculation' || q.type === 'diagram' ? `
        <div class="math-work" style="height: ${Math.max(60, q.answer_space_lines * 20)}px;"></div>
      ` : q.type !== 'multiple_choice' ? `
        <div class="answer-space" style="height: ${Math.max(40, q.answer_space_lines * 25)}px;"></div>
      ` : ''}
    </div>
  `).join('')}
  
  <div class="footer">
    <p>END OF EXAM</p>
  </div>
</body>
</html>`;
}