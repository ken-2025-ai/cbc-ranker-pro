import { corsHeaders } from '../_shared/cors.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { issue, institutionId, institutionName, issueType } = await req.json();
    
    console.log('Emergency support request:', { institutionId, institutionName, issueType });

    // Call Lovable AI Gateway to analyze and provide solution
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert technical support assistant for an educational institution management system. 
            Your role is to provide immediate, actionable solutions to technical issues.
            Be concise, clear, and provide step-by-step instructions when appropriate.
            If the issue requires admin intervention, clearly state that and explain why.`
          },
          {
            role: 'user',
            content: `Institution: ${institutionName} (ID: ${institutionId})
Issue Type: ${issueType}
Problem Description: ${issue}

Please provide:
1. Quick diagnosis of the issue
2. Immediate steps to resolve it
3. Any preventive measures for the future
4. Whether admin intervention is required`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI Gateway request failed');
    }

    const aiData = await aiResponse.json();
    const solution = aiData.choices[0].message.content;

    console.log('AI solution generated successfully');

    // Return the solution
    return new Response(
      JSON.stringify({
        success: true,
        solution,
        timestamp: new Date().toISOString(),
        issueType
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Emergency support error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process emergency support request',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
