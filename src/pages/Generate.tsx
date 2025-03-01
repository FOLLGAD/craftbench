
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SceneRenderer from "@/components/SceneRenderer";
import { useNavigate } from "react-router-dom";

const Generate = () => {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Please enter your OpenRouter API key");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Voxel Sculptor"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-opus:beta",
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
      
      if (data.choices && data.choices.length > 0) {
        // Extract code from the response, removing any markdown code blocks if present
        let generatedText = data.choices[0].message.content;
        if (generatedText.includes('```javascript')) {
          generatedText = generatedText.split('```javascript')[1].split('```')[0].trim();
        } else if (generatedText.includes('```js')) {
          generatedText = generatedText.split('```js')[1].split('```')[0].trim();
        } else if (generatedText.includes('```')) {
          generatedText = generatedText.split('```')[1].split('```')[0].trim();
        }
        
        setGeneratedCode(generatedText);
        toast.success("Code generated successfully");
      } else {
        throw new Error("No completion found in the response");
      }
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Failed to generate code"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      <header className="bg-black text-white p-4 shadow-md z-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voxel Sculptor</h1>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="bg-transparent text-white border-white hover:bg-white/10"
            onClick={() => navigate("/")}
          >
            Back to Editor
          </Button>
        </div>
      </header>
      
      <div className="flex flex-col lg:flex-row h-full gap-6 p-6">
        {/* Left side - Prompt and generated code */}
        <div className="w-full lg:w-1/3 flex flex-col gap-5">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5 overflow-hidden">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Generate Scene with AI</h2>
            <p className="text-sm text-gray-600 mb-4">
              Describe the scene you want to create, and an AI will generate the JavaScript code for you.
            </p>
            
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                OpenRouter API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenRouter API key"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">openrouter.ai/keys</a>
              </p>
            </div>
            
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-[120px] resize-none bg-gray-50 border-gray-300 focus:border-purple-400 focus:ring-purple-300 mb-4"
              placeholder="Describe your scene (e.g., 'Create a small castle with a moat')"
            />
            
            <Button 
              onClick={handleGenerate}  
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-200 shadow-md mb-4"
            >
              {isGenerating ? "Generating..." : "Generate Code"}
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5 overflow-hidden">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Generated Code</h2>
            <Textarea
              value={generatedCode}
              onChange={(e) => setGeneratedCode(e.target.value)}
              className="font-mono text-sm h-[300px] resize-none bg-gray-50 border-gray-300 focus:border-purple-400 focus:ring-purple-300"
              placeholder="AI-generated code will appear here"
            />
          </div>
        </div>
        
        {/* Right side - 3D view */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5 h-full">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Preview</h2>
            <p className="text-sm text-gray-600 mb-4">
              Preview of your AI-generated scene. Click and drag to rotate. Scroll to zoom in/out.
            </p>
            <SceneRenderer code={generatedCode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;
