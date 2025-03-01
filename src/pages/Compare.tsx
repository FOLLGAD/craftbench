
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SceneRenderer from "@/components/SceneRenderer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CopyIcon, CheckIcon, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Generation {
  id: string;
  prompt: string;
  model_name: string;
  generated_code: string;
}

const Compare = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([0, 1]);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setGenerations([]);
    setSelectedGeneration(null);
    setHasVoted(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate code");
      }

      const data = await response.json();
      setGenerations(data.generations);
      setShuffledOrder(data.shuffledOrder);
      toast.success("Generated code from two models!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVote = async (index: number) => {
    if (!generations.length || hasVoted) return;
    
    const actualIndex = shuffledOrder[index];
    const generationId = generations[actualIndex].id;
    
    try {
      const { error } = await supabase
        .from("mc-votes")
        .insert([
          {
            generation_id: generationId,
            vote: index + 1,
          }
        ]);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      setSelectedGeneration(index);
      setHasVoted(true);
      toast.success("Thanks for your vote!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record vote");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      <header className="bg-black text-white p-4 shadow-md z-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voxel Sculptor</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-300 hidden md:block">Build your blocky world with AI</p>
          <Button 
            variant="outline" 
            className="bg-transparent text-white border-white hover:bg-white/10"
            onClick={() => navigate("/")}
          >
            Back to Editor
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6 flex flex-col gap-6">
        {/* Prompt Section */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Model Comparison</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your voxel scene
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 text-lg p-4"
              placeholder="Example: A small castle with towers and a moat"
            />
          </div>

          <Button
            onClick={generateCode}
            disabled={isGenerating || !prompt}
            className="w-full py-6 text-lg bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
              </>
            ) : (
              "Generate with Two Models"
            )}
          </Button>
        </div>

        {/* Results Section */}
        {generations.length === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((index) => {
              const generation = generations[shuffledOrder[index]];
              const isSelected = selectedGeneration === index;

              return (
                <div 
                  key={index}
                  className={`bg-white rounded-lg shadow-lg border p-6 ${
                    isSelected ? "border-green-500 ring-2 ring-green-500" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Model {index + 1}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(generation.generated_code)}
                      className="flex items-center gap-2"
                    >
                      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md mb-6 overflow-auto max-h-64">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {generation.generated_code}
                    </pre>
                  </div>

                  <div className="h-64 bg-gray-800 rounded-md mb-6">
                    <SceneRenderer code={generation.generated_code} />
                  </div>

                  <Button
                    onClick={() => handleVote(index)}
                    disabled={hasVoted}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full ${
                      isSelected ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <ThumbsUp className="mr-2 h-5 w-5" /> Voted!
                      </>
                    ) : hasVoted ? (
                      "Thanks for voting!"
                    ) : (
                      "Vote for this generation"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!generations.length && !isGenerating && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-4">Ready for some AI magic?</h3>
            <p className="text-gray-500">
              Enter a prompt and generate code from two different models, then vote on which one creates the better voxel scene!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
