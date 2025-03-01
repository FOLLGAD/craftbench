
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import SceneRenderer from "@/components/SceneRenderer";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { supabase } from "@/integrations/supabase/client";

const Generate = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedModel, setUsedModel] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize PostHog with your specific key and host
    posthog.init('phc_FTO98o8i8IpbVwq7yfTBlC6dnF6s6vG130q9keHhSwe', { 
      api_host: 'https://us.i.posthog.com',
      loaded: (posthog) => {
        posthog.identify(
          `anonymous-${Math.random().toString(36).substring(2, 9)}`,
          { source: "voxel-sculptor" }
        );
      }
    });
    
    // Track page view
    posthog.capture("page_view", { page: "generate" });
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    posthog.capture("generate_started", { prompt_length: prompt.length });

    try {
      const { data, error } = await supabase.functions.invoke("generate-voxel", {
        body: { prompt }
      });

      if (error) {
        throw new Error(error.message);
      }

      setGeneratedCode(data.code || "");
      setUsedModel(data.model || "unknown model");
      toast.success(`Code generated successfully using ${data.model}`);
      posthog.capture("generate_success", { 
        prompt_length: prompt.length,
        model: data.model 
      });
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Failed to generate code"}`);
      posthog.capture("generate_error", { error: String(error) });
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
            
            {usedModel && (
              <div className="text-xs text-gray-500 mt-2">
                Generated using {usedModel}
              </div>
            )}
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
