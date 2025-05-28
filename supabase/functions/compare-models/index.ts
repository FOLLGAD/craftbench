
import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const MAX_PROMPT_LENGTH = 120;

// Available materials for the minecraft voxel scenes
const AVAILABLE_MATERIALS = [
  "stone",
  "dirt",
  "grass",
  "wood",
  "leaves",
  "glass",
  "water",
  "lava",
  "sand",
  "sandstone",
  "gravel",
  "gold",
  "iron",
  "diamond",
  "emerald",
  "bedrock",
  "obsidian",
  "brick",
  "cobblestone",
  "snow",
  "ice",
  "clay",
  "wool",
  "air",
  "orange_wool",
  "purple_wool",
  "yellow_wool",
  "green_wool",
  "blue_wool",
  "red_wool",
];

// System prompt for the models
const createSystemPrompt = () => {
  return `You write minecraft voxel scenes. You MUST provide pure Javascript code without code fences, explanations, or any other text - only JavaScript code. If you use code fences or markdown, I will be unable to use your response.

Use ONLY vanilla JavaScript. Do not use any external libraries, frameworks, or dependencies. The only functions available to you are:
1. setBlock(x, y, z, material) - sets a single block
2. fill(x1, y1, z1, x2, y2, z2, material) - fills a rectangular area

IMPORTANT: Stay within the coordinate range of -50 to 50 for all x, y, and z values. Do not place blocks outside this range.

Your materials are:
${AVAILABLE_MATERIALS.join(", ")}

Here is an example for a 6 block high 2x2 stone pillar:
\`\`\`
fill(1, 0, 0, 2, 5, 1, "stone");
\`\`\`

You should be creative, but remember: respond ONLY with plain JavaScript code, using ONLY vanilla JS and the two provided functions.
Be creative with the materials and shapes, this is a competition! The best design wins!

Use the space you have. Don't be afraid to use the entire 100x100x100 space! More detail is generally better.
`.trim();
};

// Function to extract code from potential code fences
function extractCodeFromResponse(content: string): string {
  // Check if the content contains code fences
  const codeFenceRegex = /```(?:javascript|js)?\s*\n([\s\S]*?)```/;
  const match = content.match(codeFenceRegex);

  console.log("code pre-extract", content);

  if (match?.[1]) {
    console.log("Code fences detected, extracting code", match[1].trim());
    return match[1].trim();
  }

  // If no code fences or they're empty, return the original content
  return content.replaceAll("```", "").trim();
}

// Function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return createClient(supabaseUrl, supabaseKey);
}

// Function to select random models
async function selectRandomModels() {
  const supabase = createSupabaseClient();

  const { data: modelData, error: modelError } = await supabase
    .from("mc-models")
    .select("model_name")
    .neq("is_disabled", true);

  if (modelError) {
    console.error("Error fetching models:", modelError);
    throw new Error(`Failed to fetch models: ${modelError.message}`);
  }

  const MODEL_OPTIONS = modelData.map((model) => model.model_name);

  if (MODEL_OPTIONS.length < 2) {
    console.error("Not enough models available in the database");
    throw new Error("Insufficient models available for comparison");
  }

  console.log(`Available models: ${MODEL_OPTIONS.join(", ")}`);
  const modelIndexes = new Set();
  while (modelIndexes.size < 2) {
    modelIndexes.add(Math.floor(Math.random() * MODEL_OPTIONS.length));
  }

  const modelChoices = Array.from(modelIndexes).map(
    (index) => MODEL_OPTIONS[index as number]
  );
  console.log(`Using models: ${modelChoices[0]} and ${modelChoices[1]}`);

  return modelChoices;
}

// Function to generate code with a specific model
async function generateCodeWithModel(
  modelId: string,
  prompt: string,
  supabase: any
) {
  try {
    // Start the timer for this model
    const startTime = performance.now();
    console.log(`Starting generation with ${modelId} at ${new Date().toISOString()}`);
    
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://lovable.dev/",
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: "system",
              content: createSystemPrompt(),
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 8096,
          temperature: 0.7,
          reasoning: {
            max_tokens: 1024,
          },
        }),
      }
    );

    // Log the full response
    console.log(`Response status from ${modelId}:`, response.status);
    console.log(
      `Response headers from ${modelId}:`,
      JSON.stringify(Object.fromEntries([...response.headers]))
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from OpenRouter (${modelId}):`, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: "API returned an error" } };
      }
      
      // End timer even in error case
      const endTime = performance.now();
      const executionTimeMs = endTime - startTime;
      console.log(`Model ${modelId} failed after: ${executionTimeMs.toFixed(2)}ms`);
      
      throw new Error(
        errorData.error?.message || `Failed to generate code with ${modelId}`
      );
    }

    const data = await response.json();
    console.log(`Full response from ${modelId}:`, JSON.stringify(data));

    // Get the raw content from the LLM
    const rawContent =
      data.choices[0]?.message?.content || "// No code generated";

    // Extract code if the content contains code fences
    const generatedCode = extractCodeFromResponse(rawContent);

    // End timer and log execution time
    const endTime = performance.now();
    const executionTimeMs = endTime - startTime;
    console.log(`Model ${modelId} took: ${executionTimeMs.toFixed(2)}ms`);

    console.log(`Successfully generated code with ${modelId}`);

    return storeGenerationInDatabase(modelId, prompt, generatedCode, supabase);
  } catch (error) {
    console.error(`Error generating with ${modelId}:`, error);
    return storeFallbackGeneration(modelId, prompt, error.message, supabase);
  }
}

// Function to store generation in database
async function storeGenerationInDatabase(
  modelId: string,
  prompt: string,
  generatedCode: string,
  supabase: any
) {
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
        generated_code: generatedCode,
      });

    if (insertError) {
      console.error(`Error storing generation from ${modelId}:`, insertError);
      throw new Error(`Failed to store generation: ${insertError.message}`);
    }

    console.log(
      `Successfully stored generation ${generationId} from ${modelId}`
    );
  } catch (dbError) {
    console.error(`Database error for ${modelId}:`, dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }

  // Return the generation data with the confirmed ID
  return {
    id: generationId,
    prompt,
    model_name: modelId,
    generated_code: generatedCode,
  };
}

// Function to store fallback generation
async function storeFallbackGeneration(
  modelId: string,
  prompt: string,
  errorMessage: string,
  supabase: any
) {
  // Generate UUID for fallback generation
  const fallbackId = crypto.randomUUID();
  const fallbackCode = `// Error generating code with ${modelId}: ${errorMessage}\n// Fallback code\nfill(0, 0, 0, 10, 1, 10, 'stone');\nsetBlock(5, 2, 5, 'gold');`;

  // Store fallback generation in database
  try {
    const { error: insertError } = await supabase
      .from("mc-generations")
      .insert({
        id: fallbackId,
        prompt,
        model_name: modelId,
        generated_code: fallbackCode,
      });

    if (insertError) {
      console.error(
        `Error storing fallback generation from ${modelId}:`,
        insertError
      );
    } else {
      console.log(
        `Successfully stored fallback generation ${fallbackId} from ${modelId}`
      );
    }
  } catch (dbError) {
    console.error(`Database error for fallback ${modelId}:`, dbError);
  }

  // Return the fallback generation
  return {
    id: fallbackId,
    prompt,
    model_name: modelId,
    generated_code: fallbackCode,
  };
}

// Function to store comparison in database and return the comparison object
async function storeComparisonInDatabase(
  generation1: any,
  generation2: any,
  prompt: string,
  supabase: any,
  userId?: string
) {
  try {
    // Generate UUID for the comparison
    const comparisonId = crypto.randomUUID();

    // Create the comparison object with user_id if available
    const comparisonObject = {
      id: comparisonId,
      generation_a_id: generation1.id,
      generation_b_id: generation2.id,
      prompt,
      user_id: userId || null,
    };

    // Insert the comparison into the database
    const { error: comparisonError } = await supabase
      .from("mc-comparisons")
      .insert(comparisonObject);

    if (comparisonError) {
      console.error("Comparison insert error:", comparisonError);
      throw new Error(`Failed to store comparison: ${comparisonError.message}`);
    }

    console.log("Comparison stored successfully with ID:", comparisonId);

    // Return the comparison object so it can be included in the response
    return comparisonObject;
  } catch (error) {
    console.error("Error storing comparison:", error);
    throw new Error(`Error storing comparison: ${error.message}`);
  }
}

// Main request handler
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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate prompt length
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured on server" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient();

    // Get the current user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    let currentUserId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (!userError && user) {
          currentUserId = user.id;
          console.log("User authenticated:", currentUserId);
        }
      } catch (error) {
        console.log("Error getting user from token:", error);
      }
    }

    // Randomly select two different models
    const modelChoices = await selectRandomModels();

    // Generate code with both models concurrently with no timeouts
    try {
      // Log the start of the overall generation process
      const overallStartTime = performance.now();
      console.log(`Starting generation for two models at ${new Date().toISOString()}`);
      
      const [generation1, generation2] = await Promise.all([
        generateCodeWithModel(modelChoices[0], prompt, supabase),
        generateCodeWithModel(modelChoices[1], prompt, supabase),
      ]);

      // Log the end of the overall generation process
      const overallEndTime = performance.now();
      const overallExecutionTimeMs = overallEndTime - overallStartTime;
      console.log(`Total generation process took: ${overallExecutionTimeMs.toFixed(2)}ms`);

      const generations = [generation1, generation2];
      const shuffledOrder = Math.random() > 0.5 ? [0, 1] : [1, 0];

      // Store the comparison in the database and get the comparison object
      const comparison = await storeComparisonInDatabase(
        generation1,
        generation2,
        prompt,
        supabase,
        currentUserId
      );

      return new Response(
        JSON.stringify({
          generations,
          shuffledOrder,
          comparison, // Include the comparison object in the response
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error generating with models:", error);
      return new Response(
        JSON.stringify({
          error: error.message || "Failed to generate code with models",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in compare-models function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
