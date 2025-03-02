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

interface Comparison {
  id: string;
  generation_a_id: string;
  generation_b_id: string;
  prompt: string;
}

const Compare = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
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
    setComparison(null);
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

      console.log("Received data:", data);
      
      // If there's no comparison in the response, we can't proceed properly
      if (!data.comparison) {
        throw new Error("No comparison ID received from server. Please try again.");
      }
      
      setGenerations(data.generations);
      setComparison(data.comparison);
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

  const handleVote = async (index: number, comparisonId: string) => {
    if (!generations.length || hasVoted || !comparisonId) return;
    
    try {
      // Get the selected generation's ID based on the shuffled order
      const selectedGenId = generations[shuffledOrder[index]].id;
      
      console.log("Voting for comparison:", comparisonId, "with generation:", selectedGenId);
      
      const { error } = await supabase
        .from("mc-votes")
        .insert({
          comparison_id: comparisonId,
          generation_id: selectedGenId, // This should point to an mc-generations record
          vote: index + 1
        });

      if (error) {
        console.error("Vote error:", error);
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
    setComparison(null);
    setSelectedGeneration(null);
    setHasVoted(false);
  };

  const resetError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
        {/* Prompt Section - Only show when no generations are available */}
        {generations.length === 0 && !isGenerating && !error && (
          <div className="w-full max-w-3xl animate-fadeIn">
            <PromptInput 
              prompt={prompt} 
              setPrompt={setPrompt} 
              generateCode={generateCode} 
              isGenerating={isGenerating} 
            />
          </div>
        )}

        {/* Loading State */}
        {isGenerating && <LoadingState />}

        {/* Error State */}
        {error && !isGenerating && <ErrorState error={error} onReset={resetError} />}

        {/* Results Section */}
        {generations.length > 0 && !isGenerating && !error && comparison && (
          <div className="w-full animate-scaleIn">
            <ResultsSection 
              generations={generations}
              shuffledOrder={shuffledOrder}
              selectedGeneration={selectedGeneration}
              hasVoted={hasVoted}
              comparisonId={comparison.id}
              onVote={handleVote}
              onReset={resetComparison}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Compare;
