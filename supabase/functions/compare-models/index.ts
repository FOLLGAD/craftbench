
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";

// List of models to choose from, exactly as specified
const MODEL_OPTIONS = [
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.7-sonnet:thinking",
  "anthropic/claude-3.7-sonnet",
  "openai/o3-mini",
  "openai/o3-mini-high",
  "openai/gpt-4o-2024-11-20",
  "google/gemini-2.0-pro-exp-02-05:free",
  "openai/gpt-4.5-preview",
  "google/gemini-2.0-flash-lite-001",
  "google/gemini-2.0-flash-001",
  "deepseek/deepseek-r1",
  "deepseek/deepseek-chat"
];

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prompt } = body;

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
    const modelIndexes = new Set();
    while (modelIndexes.size < 2) {
      modelIndexes.add(Math.floor(Math.random() * MODEL_OPTIONS.length));
    }
    
    const modelChoices = Array.from(modelIndexes).map(index => MODEL_OPTIONS[index]);
    console.log(`Using models: ${modelChoices[0]} and ${modelChoices[1]}`);

    // Generate code with both models
    const generations = await Promise.all(
      modelChoices.map(async (modelId) => {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://lovable.dev/"
            },
            body: JSON.stringify({
              model: modelId,
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
            const errorText = await response.text();
            console.error(`Error from OpenRouter (${modelId}):`, errorText);
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { error: { message: "API returned an error" } };
            }
            throw new Error(errorData.error?.message || `Failed to generate code with ${modelId}`);
          }

          const data = await response.json();
          const generatedCode = data.choices[0]?.message?.content || "// No code generated";

          // Store generation in database
          const { data: insertedGeneration, error } = await supabase
            .from("mc-generations")
            .insert([
              {
                prompt,
                model_name: modelId,
                generated_code: generatedCode,
              }
            ])
            .select();

          if (error) {
            console.error("Supabase insert error:", error);
            throw new Error(`Database error: ${error.message}`);
          }

          if (!insertedGeneration || insertedGeneration.length === 0) {
            throw new Error("Failed to insert generation into database");
          }

          return insertedGeneration[0];
        } catch (error) {
          console.error(`Error generating with ${modelId}:`, error);
          // Return a fallback generation instead of failing the whole request
          return {
            id: crypto.randomUUID(),
            prompt,
            model_name: modelId,
            generated_code: `// Error generating code with ${modelId}: ${error.message}\n// Fallback code\nfill(0, 0, 0, 10, 1, 10, 'stone');\nsetBlock(5, 2, 5, 'gold');`,
            created_at: new Date().toISOString()
          };
        }
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
      console.error("Comparison insert error:", comparisonError);
      throw new Error(`Database error: ${comparisonError.message}`);
    }

    // Define the shuffled order
    const shuffledOrder = Math.random() > 0.5 ? [0, 1] : [1, 0];

    return new Response(
      JSON.stringify({ 
        generations,
        comparison: comparison[0],
        shuffledOrder
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in compare-models function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
