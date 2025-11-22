import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an ultra-high-performance CBC Exam Generator AI for Kenya's Competency-Based Curriculum.
Your job is to generate PERFECT, curriculum-aligned CBC exams with correct format, spacing, diagrams, and topic logic.

=== CRITICAL OUTPUT RULE ===
Return ONLY valid JSON. No explanations, no markdown, no extra text. Just the JSON object.

=== TOPIC FILTERING (VERY IMPORTANT) ===
1. Use ONLY the topics explicitly listed in "covered_topics" - these are topics the teacher has taught
2. DO NOT generate questions on ANY topic not in the covered_topics list
3. You may include up to 20% spiral progression from previous grade, BUT ONLY for topics directly related to covered topics
   Example: If teacher covered "Grade 6 Fractions", you can reference "Grade 5 Fractions" but NOT shapes or algebra
4. If a sub-topic is not in covered_topics, DO NOT use it - even if it's in the same strand
5. Prioritize depth over breadth - test the covered topics thoroughly

=== QUESTION DISTRIBUTION (MUST FOLLOW) ===
Distribute questions according to Bloom's taxonomy:
- 40% Knowledge & Understanding (remember, understand) - recall, definitions, labeling
- 30% Application (apply) - real-world, task-based, practical problems
- 20% Reasoning/Problem Solving (analyse, evaluate) - scenario-based, cross-cutting competencies
- 10% Competency-Based Performance (create) - hands-on tasks, projects, integrated tasks

=== FORMAT BY GRADE LEVEL ===

PP1/PP2 FORMAT:
- Very simple language, short sentences (max 8 words per sentence)
- Activities: "Circle the...", "Match the...", "Trace the...", "Colour the..."
- Large spacing: multiply ALL answer_space_lines by 2
- Include image placeholders: [IMAGE: description]
- Marks: 1-2 per question
- No complex instructions

Lower Primary (Grade 1-3) FORMAT:
- Simple structured questions
- Clear, direct language
- Wide spacing for large handwriting
- Include diagrams where needed: [DIAGRAM: description]
- Mix of question types: fill-in-blank, short answer, matching

Upper Primary (Grade 4-6 / KPSEA Format):
- SECTION A: Short Questions (1-3 marks each) - 40% of marks
- SECTION B: Structured Questions (4-8 marks each) - 40% of marks  
- SECTION C: Long Response (9-15 marks each) - 20% of marks
- Large working space for Mathematics
- Include proper diagrams with labels
- Clear instructions per section

Junior Secondary (Grade 7-9 / KJSEA Format):
- SECTION A: Short Questions (1-3 marks) - 30% of marks
- SECTION B: Structured Questions (5-10 marks) - 50% of marks
- SECTION C: Extended Response/Task (15-25 marks) - 20% of marks
- Advanced reasoning required
- Proper scientific diagrams with labels
- Cross-cutting competencies integration

=== SPACING RULES (CRITICAL) ===
Calculate answer_space_lines for each question:
- Short answers (1-2 marks): 4 lines
- Medium answers (3-5 marks): 8 lines
- Long answers (6-10 marks): 12 lines
- Math calculations: marks × 4 (minimum 10 lines)
- Diagrams: diagram_height_px = marks × 80 (minimum 150px)
- PP1/PP2: multiply ALL spacing by 2

=== DIAGRAM REQUIREMENTS ===
For questions requiring diagrams:
1. Set type: "diagram"
2. Include diagram_instructions object:
   {
     "type": "label" | "draw" | "complete",
     "description": "Clear description of what to draw/label",
     "elements": ["element1", "element2"],
     "height_px": calculated height,
     "grid": true/false (for graphs)
   }
3. In question_text include: [DIAGRAM SPACE PROVIDED]
4. For Science: follow proper scientific diagram conventions

=== QUESTION OBJECT STRUCTURE ===
Each question MUST have:
{
  "number": integer (sequential, no gaps),
  "type": "multiple_choice" | "short_answer" | "long_answer" | "calculation" | "diagram" | "practical" | "matching",
  "question_text": "Clear, age-appropriate question text",
  "options": ["A option", "B option", "C option", "D option"], // ONLY for MCQs, exactly 4
  "expected_answer": "Complete model answer with working where applicable",
  "marks": integer,
  "strand": "MUST be from input strands",
  "sub_strand": "Specific sub-topic within strand",
  "bloom_level": "remember" | "understand" | "apply" | "analyse" | "evaluate" | "create",
  "difficulty_score": 0.0 to 1.0 (0=easiest, 1=hardest),
  "marking_rubric": {
    "criteria": "Step-by-step marking guide",
    "allocation": "Mark breakdown: [step1: 2 marks, step2: 3 marks]",
    "notes": "Acceptable alternative answers"
  },
  "answer_space_lines": integer (calculated using spacing rules),
  "math_work_area": { // for calculation type
    "grid_lines": true/false,
    "monospace": true,
    "rows": integer
  },
  "diagram_instructions": { // for diagram type
    "type": string,
    "description": string,
    "elements": array,
    "height_px": integer
  }
}

=== OUTPUT JSON STRUCTURE ===
{
  "metadata": {
    "exam_id": "uuid",
    "school_name": "from input",
    "class_level": "from input",
    "subject": "from input",
    "exam_type": "from input",
    "term": "from input or current",
    "year": "current year",
    "paper_number": "from input",
    "time_allowed_minutes": "from input",
    "total_marks": "sum of all question marks",
    "question_count": "count of questions",
    "strands_covered": ["list of strands used"]
  },
  "exam_instructions": "Clear CBC-style instructions for learners:\n1. Write your name and admission number\n2. Answer ALL questions\n3. Show all working clearly\n4. [Add any extra_instructions from input]",
  "sections": [
    {
      "name": "SECTION A - Knowledge & Understanding",
      "question_numbers": [1, 2, 3, ...],
      "instructions": "Answer all questions in this section",
      "marks": total marks for section
    }
  ],
  "questions": [array of question objects as defined above],
  "marking_scheme_text": "Complete human-readable marking scheme with:\n\nQUESTION 1 (X marks)\n[Model answer]\nMarking: [detailed breakdown]\n\nQUESTION 2...",
  "validation_errors": [],
  "warnings": []
}

=== VALIDATION (AUTO-CHECK) ===
Before returning JSON, verify:
1. total_marks = sum of all question marks
2. All strands used are from input strands array
3. Question distribution approximately: 40% remember/understand, 30% apply, 20% analyse/evaluate, 10% create
4. Sequential numbering 1, 2, 3... with no gaps
5. All questions have complete marking_rubric
6. Difficulty mix matches input percentages (within ±10% tolerance)
7. Age-appropriate language for grade level
8. Sections properly defined with question numbers

If validation fails, add to validation_errors array with clear description.

=== SAFETY RULES (NEVER DO) ===
- Include topics NOT in provided strands
- Use foreign curriculum content
- Generate repetitive/duplicate questions
- Compress answer spacing
- Use inappropriate difficulty for grade
- Include biased or offensive content
- Skip marking rubrics
- Use incorrect Bloom level

=== KNEC COMPLIANCE ===
- Follow official KNEC format templates
- Include candidate information section
- Use correct header format with school name
- Add "For Examiner's Use Only" boxes
- Time allocation clearly stated
- Proper section divisions

Generate complete, valid exam JSON now.`;

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
    if (!body.subject || !body.class_level || !body.covered_topics || Object.keys(body.covered_topics).length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required inputs: subject, class_level, and covered_topics (topics teacher has taught)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format covered topics for logging and storage
    const coveredTopicsList = Object.entries(body.covered_topics)
      .map(([strand, topics]: [string, any]) => `${strand}: ${topics.join(", ")}`)
      .join("; ");
    
    console.log('Covered topics:', coveredTopicsList);

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

    // Prepare AI request with detailed topic information
    const userPrompt = `Generate a ${body.exam_type || 'End Term'} exam.

**COVERED TOPICS (ONLY USE THESE - Teacher has taught these specific topics):**
${Object.entries(body.covered_topics).map(([strand, topics]: [string, any]) => 
  `\n${strand}:\n${topics.map((t: string) => `  - ${t}`).join('\n')}`
).join('\n')}

**EXAM DETAILS:**
- Subject: ${body.subject}
- Class Level: ${body.class_level}
- School: ${body.school_name || 'School'}
- Term: ${body.term || 1}, Year: ${body.year || new Date().getFullYear()}
- Teacher: ${body.teacher_name || 'Not specified'}
- Time: ${body.time_allowed_minutes || 60} minutes
- Questions: ${body.question_count || 10}
- Difficulty: Easy ${body.difficulty?.easy || 40}%, Medium ${body.difficulty?.medium || 40}%, Hard ${body.difficulty?.hard || 20}%
- Include Diagrams: ${body.include_diagrams ? 'Yes' : 'No'}
- Include OMR: ${body.include_omr ? 'Yes (for MCQs)' : 'No'}
${body.extra_instructions ? `- Additional Instructions: ${body.extra_instructions}` : ''}

**CRITICAL REQUIREMENTS:**
1. Generate questions ONLY from the covered topics listed above
2. Do NOT include ANY topic not in the covered list
3. Test each covered topic thoroughly with appropriate question types
4. Ensure age-appropriate difficulty for ${body.class_level}
5. Follow proper CBC/KNEC format
6. Include detailed marking scheme for each question
7. Provide adequate answer spacing

Generate the complete exam JSON now.`;

    const aiPayload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      stream: true,
      max_tokens: 16000,
      temperature: body.seed ? 0.0 : 0.15
    };

    // Call Lovable AI
    console.log('Calling Lovable AI with model: google/gemini-2.5-flash');
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(aiPayload)
    });

    console.log('AI Response status:', aiResp.status);

    if (aiResp.status === 402) {
      console.error('Payment required error');
      await supabase.from('exams').update({
        status: 'error',
        ai_metadata: { error: '402_PAYMENT_REQUIRED', message: 'Add credits to Lovable AI workspace' }
      }).eq('id', examId);
      
      return new Response(
        JSON.stringify({ 
          error: 'Payment required to access AI model. Please add credits to your Lovable workspace.',
          exam_id: examId
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (aiResp.status === 429) {
      console.error('Rate limit exceeded');
      await supabase.from('exams').update({
        status: 'error',
        ai_metadata: { error: '429_RATE_LIMITED', message: 'Too many requests' }
      }).eq('id', examId);
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          exam_id: examId
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      console.error('AI API error:', aiResp.status, errorText);
      await supabase.from('exams').update({
        status: 'error',
        ai_metadata: { error: 'AI_API_ERROR', status: aiResp.status, details: errorText }
      }).eq('id', examId);
      
      throw new Error(`AI API error: ${aiResp.status} - ${errorText}`);
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
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header h1 { font-size: 18pt; margin: 5px 0; font-family: 'Times New Roman', serif; }
    .header p { margin: 3px 0; font-size: 12pt; font-family: 'Times New Roman', serif; }
    .instructions { margin: 20px 0; padding: 15px; border: 1px solid #000; font-size: 12pt; }
    .question { margin: 20px 0; page-break-inside: avoid; }
    .question-header { font-weight: bold; margin-bottom: 10px; font-size: 12pt; }
    .question-text { margin: 10px 0 10px 20px; font-size: 12pt; }
    .options { margin: 10px 0 10px 40px; list-style-type: upper-alpha; font-size: 12pt; }
    .answer-space { border: 1px dashed #666; min-height: 40px; padding: 10px; margin: 10px 0 10px 20px; font-size: 12pt; }
    .math-work { font-family: 'Times New Roman', serif; font-size: 12pt; border: 1px solid #000; padding: 10px; margin: 10px 0 10px 20px; min-height: 60px; }
    .footer { margin-top: 30px; text-align: center; font-size: 12pt; font-family: 'Times New Roman', serif; }
    .candidate-info { font-size: 12pt; }
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
    <p>Date: _______________</p>
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