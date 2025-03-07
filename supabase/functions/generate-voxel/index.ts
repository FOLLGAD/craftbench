
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";

// List of models to choose from
const MODELS = [
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
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Select a random model from the list
    const randomModel = MODELS[Math.floor(Math.random() * MODELS.length)];
    console.log(`Using model: ${randomModel}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "Voxel Sculptor"
      },
      body: JSON.stringify({
        model: randomModel,
        messages: [
          {
            role: "system",
            content: "You are an expert JavaScript programmer specializing in creating 3D voxel scenes. Generate complete, working JavaScript code for the Voxel Sculptor app. The app has two main functions: setBlock(x, y, z, 'blockType') to place individual blocks and fill(x1, y1, z1, x2, y2, z2, 'blockType') to fill a 3D area with blocks. Available block types are: 'grass', 'stone', 'dirt', 'wood', 'water', 'sand', 'glass', 'gold', 'cobblestone', 'brick', 'leaves', 'bedrock', and 'air' (removes blocks). Output ONLY valid JavaScript code without explanations or markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    let generatedText = data.choices && data.choices.length > 0 ? data.choices[0].message.content : "";
    
    // Extract code from markdown if present
    if (generatedText.includes('```javascript')) {
      generatedText = generatedText.split('```javascript')[1].split('```')[0].trim();
    } else if (generatedText.includes('```js')) {
      generatedText = generatedText.split('```js')[1].split('```')[0].trim();
    } else if (generatedText.includes('```')) {
      generatedText = generatedText.split('```')[1].split('```')[0].trim();
    }

    return new Response(
      JSON.stringify({ code: generatedText, model: randomModel }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
