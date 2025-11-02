import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "subject_analysis":
        systemPrompt = "You are an educational analytics expert. Analyze subject performance data and provide actionable insights for improvement.";
        userPrompt = `Analyze this subject performance data and provide:
1. Key trends and patterns
2. Areas of concern
3. Specific recommendations for improvement
4. Predicted future performance if current trends continue

Data: ${JSON.stringify(data)}`;
        break;

      case "class_analysis":
        systemPrompt = "You are an educational analytics expert specializing in class performance analysis.";
        userPrompt = `Analyze this class performance data and provide:
1. Overall class performance assessment
2. Comparison with school average
3. Individual subject strengths and weaknesses
4. Recommendations for class teacher
5. Suggested interventions

Data: ${JSON.stringify(data)}`;
        break;

      case "student_improvement":
        systemPrompt = "You are an educational analytics expert focused on student growth and improvement.";
        userPrompt = `Analyze this student progress data and provide:
1. Rate of improvement analysis
2. Strengths and areas of growth
3. Comparison with peers
4. Personalized recommendations

Data: ${JSON.stringify(data)}`;
        break;

      case "teacher_performance":
        systemPrompt = "You are an educational analytics expert specializing in teacher effectiveness analysis.";
        userPrompt = `Analyze this teacher's class performance data and provide:
1. Overall teaching effectiveness rating
2. Subject-wise performance of classes
3. Student improvement rates under this teacher
4. Strengths and areas for professional development
5. Comparative analysis with other teachers

Data: ${JSON.stringify(data)}`;
        break;

      case "overall_insights":
        systemPrompt = "You are a school administrator's AI assistant providing comprehensive educational insights.";
        userPrompt = `Analyze this comprehensive school performance data and provide:
1. Executive summary of school performance
2. Key achievements and challenges
3. Department-wise analysis
4. Strategic recommendations for the next term
5. Risk areas that need immediate attention
6. Opportunities for excellence

Data: ${JSON.stringify(data)}`;
        break;

      default:
        throw new Error("Invalid analysis type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const insights = aiResponse.choices[0].message.content;

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analytics-insights:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
