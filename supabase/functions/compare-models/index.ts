
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";

// List of models to choose from
const MODEL_OPTIONS = [
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "google/gemini-1.5-pro", name: "Gemini Pro" },
  { id: "mistralai/mistral-large", name: "Mistral Large" }
];

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Randomly select two different models
    const shuffledModels = [...MODEL_OPTIONS].sort(() => Math.random() - 0.5).slice(0, 2);
    console.log(`Using models: ${shuffledModels[0].id} and ${shuffledModels[1].id}`);

    // Generate code with both models
    const generations = await Promise.all(
      shuffledModels.map(async (model) => {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://lovable.dev/"
          },
          body: JSON.stringify({
            model: model.id,
            messages: [
              { 
                role: "system", 
                content: "You are a JavaScript expert that writes clean, working code for voxel scenes. You only provide pure JavaScript code without explanations. Your code should use setBlock(x, y, z, 'material') and fill(x1, y1, z1, x2, y2, z2, 'material') to create voxel scenes." 
              },
              { role: "user", content: prompt }
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Failed to generate code with ${model.id}`);
        }

        const data = await response.json();
        const generatedCode = data.choices[0]?.message?.content || "// No code generated";

        // Store generation in database
        const { data: insertedGeneration, error } = await supabase
          .from("mc-generations")
          .insert([
            {
              prompt,
              model_name: model.id,
              generated_code: generatedCode,
            }
          ])
          .select();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return insertedGeneration[0];
      })
    );

    // Store the comparison in the database
    const { data: comparison, error: comparisonError } = await supabase
      .from("mc-comparisons")
      .insert([
        {
          generation_a_id: generations[0].id,
          generation_b_id: generations[1].id,
          prompt
        }
      ])
      .select();

    if (comparisonError) {
      throw new Error(`Database error: ${comparisonError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        generations,
        comparison: comparison[0],
        shuffledOrder: Math.random() > 0.5 ? [0, 1] : [1, 0]
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
