
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

// Available materials for the minecraft voxel scenes
const AVAILABLE_MATERIALS = [
  "stone", "dirt", "grass", "wood", "leaves", "glass", 
  "water", "lava", "sand", "gravel", "gold", "iron", 
  "diamond", "emerald", "bedrock", "obsidian", "brick", 
  "cobblestone", "snow", "ice", "clay", "wool", "air"
];

// Function to extract code from potential code fences
function extractCodeFromResponse(content: string): string {
  // Check if the content contains code fences
  const codeFenceRegex = /```(?:javascript|js)?\s*\n([\s\S]*?)```/;
  const match = content.match(codeFenceRegex);
  
  if (match && match[1]) {
    console.log("Code fences detected, extracting code");
    return match[1].trim();
  }
  
  // If no code fences or they're empty, return the original content
  return content;
}

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

    // Set a timeout for the fetch requests
    const FETCH_TIMEOUT = 8000; // 8 seconds

    // Function to fetch with timeout
    const fetchWithTimeout = async (url, options, timeout) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    // Create the minecraft-specific system prompt with explicit instruction about format
    const systemPrompt = `You write minecraft voxel scenes. You MUST provide pure Javascript code without code fences, explanations, or any other text - only JavaScript code. If you use code fences or markdown, I will be unable to use your response.

Your materials are:
${AVAILABLE_MATERIALS.join(", ")}

You can be creative, but remember: respond ONLY with plain JavaScript code and nothing else.`;

    // Generate code with both models with timeout
    const generateCode = async (modelId) => {
      try {
        console.log(`Starting generation with ${modelId}`);
        const response = await fetchWithTimeout(
          "https://openrouter.ai/api/v1/chat/completions",
          {
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
                  content: systemPrompt
                },
                { role: "user", content: prompt }
              ],
              max_tokens: 4096,
              temperature: 0.7,
              reasoning: {
                max_tokens: 1000
              }
            }),
          },
          FETCH_TIMEOUT
        );

        // Log the full response
        console.log(`Response status from ${modelId}:`, response.status);
        console.log(`Response headers from ${modelId}:`, JSON.stringify(Object.fromEntries([...response.headers])));
        
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
        console.log(`Full response from ${modelId}:`, JSON.stringify(data));
        
        // Get the raw content from the LLM
        const rawContent = data.choices[0]?.message?.content || "// No code generated";
        
        // Extract code if the content contains code fences
        const generatedCode = extractCodeFromResponse(rawContent);
        
        console.log(`Successfully generated code with ${modelId}`);

        // Generate UUID for the new generation
        const generationId = crypto.randomUUID();

        // Immediately store generation in database and return the ID
        try {
          const { error: insertError } = await supabase
            .from("mc-generations")
            .insert({
              id: generationId,
              prompt,
              model_name: modelId,
              generated_code: generatedCode
            });

          if (insertError) {
            console.error(`Error storing generation from ${modelId}:`, insertError);
            throw new Error(`Failed to store generation: ${insertError.message}`);
          }
          
          console.log(`Successfully stored generation ${generationId} from ${modelId}`);
        } catch (dbError) {
          console.error(`Database error for ${modelId}:`, dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }

        // Return the generation data with the confirmed ID
        return {
          id: generationId,
          prompt,
          model_name: modelId,
          generated_code: generatedCode
        };
      } catch (error) {
        console.error(`Error generating with ${modelId}:`, error);
        
        // Generate UUID for fallback generation
        const fallbackId = crypto.randomUUID();
        const fallbackCode = `// Error generating code with ${modelId}: ${error.message}\n// Fallback code\nfill(0, 0, 0, 10, 1, 10, 'stone');\nsetBlock(5, 2, 5, 'gold');`;
        
        // Store fallback generation in database
        try {
          const { error: insertError } = await supabase
            .from("mc-generations")
            .insert({
              id: fallbackId,
              prompt,
              model_name: modelId,
              generated_code: fallbackCode
            });

          if (insertError) {
            console.error(`Error storing fallback generation from ${modelId}:`, insertError);
          } else {
            console.log(`Successfully stored fallback generation ${fallbackId} from ${modelId}`);
          }
        } catch (dbError) {
          console.error(`Database error for fallback ${modelId}:`, dbError);
        }
        
        // Return the fallback generation
        return {
          id: fallbackId,
          prompt,
          model_name: modelId,
          generated_code: fallbackCode
        };
      }
    };

    // Run generation for both models concurrently with timeouts
    const [generation1, generation2] = await Promise.all([
      generateCode(modelChoices[0]),
      generateCode(modelChoices[1])
    ]);

    const generations = [generation1, generation2];
    const shuffledOrder = Math.random() > 0.5 ? [0, 1] : [1, 0];

    // Store the comparison in the database
    try {
      const { error: comparisonError } = await supabase
        .from("mc-comparisons")
        .insert({
          generation_a_id: generation1.id,
          generation_b_id: generation2.id,
          prompt
        });

      if (comparisonError) {
        console.error("Comparison insert error:", comparisonError);
      } else {
        console.log("Comparison stored successfully");
      }
    } catch (error) {
      console.error("Error storing comparison:", error);
    }

    return new Response(
      JSON.stringify({ 
        generations,
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
