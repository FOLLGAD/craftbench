
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/compare/Header";
import PromptInput from "@/components/compare/PromptInput";
import LoadingState from "@/components/compare/LoadingState";
import ErrorState from "@/components/compare/ErrorState";
import ResultsSection from "@/components/compare/ResultsSection";

interface Generation {
  id: string;
  prompt: string;
  model_name: string;
  generated_code: string;
}

const Compare = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([0, 1]);
  const [error, setError] = useState<string | null>(null);

  const generateCode = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setGenerations([]);
    setSelectedGeneration(null);
    setHasVoted(false);
    setError(null);

    try {
      // Use supabase's functions.invoke instead of fetch for better error handling
      const { data, error: functionError } = await supabase.functions.invoke('compare-models', {
        body: { prompt }
      });

      if (functionError) {
        throw new Error(functionError.message || "Failed to generate code");
      }

      if (!data || !data.generations || data.generations.length !== 2) {
        throw new Error("Invalid response from server");
      }

      console.log("Received generations:", data.generations);
      setGenerations(data.generations);
      setShuffledOrder(data.shuffledOrder || [0, 1]);
      toast.success("Generated code from two models!");
    } catch (error) {
      console.error("Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVote = async (index: number) => {
    if (!generations.length || hasVoted) return;
    
    const actualIndex = shuffledOrder[index];
    const generationId = generations[actualIndex].id;
    
    try {
      console.log("Voting for generation:", generationId);
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
      console.error("Vote error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to record vote");
    }
  };

  const resetComparison = () => {
    setGenerations([]);
    setSelectedGeneration(null);
    setHasVoted(false);
  };

  const resetError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      <Header />

      <div className="container mx-auto p-6 flex flex-col gap-6">
        {/* Prompt Section - Only show when no generations are available */}
        {generations.length === 0 && !isGenerating && !error && (
          <PromptInput 
            prompt={prompt} 
            setPrompt={setPrompt} 
            generateCode={generateCode} 
            isGenerating={isGenerating} 
          />
        )}

        {/* Loading State */}
        {isGenerating && <LoadingState />}

        {/* Error State */}
        {error && !isGenerating && <ErrorState error={error} onReset={resetError} />}

        {/* Results Section */}
        {generations.length > 0 && !isGenerating && !error && (
          <ResultsSection 
            generations={generations}
            shuffledOrder={shuffledOrder}
            selectedGeneration={selectedGeneration}
            hasVoted={hasVoted}
            onVote={handleVote}
            onReset={resetComparison}
          />
        )}
      </div>
    </div>
  );
};

export default Compare;
