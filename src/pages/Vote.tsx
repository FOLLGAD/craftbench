
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import VoteComparison from "@/components/vote/VoteComparison";
import VoteHeader from "@/components/vote/VoteHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/compare/LoadingState";
import ErrorState from "@/components/compare/ErrorState";

type Generation = {
  id: string;
  prompt: string;
  model_name: string;
  generated_code: string;
};

type Comparison = {
  id: string;
  generation_a_id: string;
  generation_b_id: string;
  prompt: string;
  generations: Generation[];
  voted: boolean;
  votes: {
    [key: string]: number;
  };
};

const Vote = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votedComparisons, setVotedComparisons] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch comparisons that have at least one vote
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["votable-comparisons"],
    queryFn: async () => {
      // Get all comparisons from mc-comparisons
      const { data: comparisons, error: comparisonsError } = await supabase
        .from("mc-comparisons")
        .select("id, prompt, generation_a_id, generation_b_id")
        .order("created_at", { ascending: false });

      if (comparisonsError) throw new Error(comparisonsError.message);
      if (!comparisons || comparisons.length === 0) return [];

      // Collect all generation IDs to fetch in a single query
      const generationIds = comparisons.flatMap(comparison => [
        comparison.generation_a_id, 
        comparison.generation_b_id
      ]);

      // Fetch all generations in a single query
      const { data: allGenerations, error: generationsError } = await supabase
        .from("mc-generations")
        .select("*")
        .in("id", generationIds);

      if (generationsError) throw new Error(generationsError.message);
      
      // Create a map of generation ids to generation objects for quick lookup
      const generationsMap = Object.fromEntries(
        (allGenerations || []).map(gen => [gen.id, gen])
      );

      // Get user ID for checking votes
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Get all votes in a single query
      const { data: allVotes, error: votesError } = await supabase
        .from("mc-votes")
        .select("comparison_id, generation_id, count, user_id");

      if (votesError) throw new Error(votesError.message);

      // Process each comparison with its generations and votes
      const comparisonData = comparisons.map(comparison => {
        // Get both generations from the map
        const genA = generationsMap[comparison.generation_a_id];
        const genB = generationsMap[comparison.generation_b_id];
        
        // Filter votes for this comparison
        const comparisonVotes = (allVotes || []).filter(
          vote => vote.comparison_id === comparison.id
        );

        // Check if user has voted on this comparison
        const hasVoted = userId && comparisonVotes.some(
          vote => vote.user_id === userId
        );

        // Count votes per generation
        const voteCounts: { [key: string]: number } = {};
        comparisonVotes.forEach(vote => {
          const genId = vote.generation_id;
          if (!voteCounts[genId]) voteCounts[genId] = 0;
          voteCounts[genId] += 1;
        });

        return {
          id: comparison.id,
          generation_a_id: comparison.generation_a_id,
          generation_b_id: comparison.generation_b_id,
          prompt: comparison.prompt,
          generations: [genA, genB].filter(Boolean),
          voted: !!hasVoted,
          votes: voteCounts
        };
      });

      return comparisonData.filter(comp => comp.generations.length === 2);
    },
  });

  useEffect(() => {
    // Update the votedComparisons set when data changes
    if (data) {
      const newVotedSet = new Set<string>();
      data.forEach(comparison => {
        if (comparison.voted) {
          newVotedSet.add(comparison.id);
        }
      });
      setVotedComparisons(newVotedSet);
    }
  }, [data]);

  const handleVote = async (
    comparisonId: string,
    generationId: string
  ) => {
    try {
      // Add the vote value (1) to fix the not-null constraint
      const { error } = await supabase.from("mc-votes").insert({
        comparison_id: comparisonId,
        generation_id: generationId,
        vote: 1  // Adding the required vote value
      });

      if (error) throw error;

      // Update local state to mark this comparison as voted
      setVotedComparisons(prev => new Set([...prev, comparisonId]));
      
      // Refresh the data to get updated vote counts
      refetch();
      
      toast({
        title: "Vote recorded",
        description: "Thanks for your vote!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to record vote: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (data && currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: "No more comparisons",
        description: "You've reviewed all available comparisons.",
      });
    }
  };

  const handleCreateNew = () => {
    navigate("/");
  };

  const handleResetError = () => {
    refetch();
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={(error as Error).message} onReset={handleResetError} />;
  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <VoteHeader />
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-4">No comparisons available</h2>
          <p className="text-gray-600 mb-6">Create a new comparison to get started.</p>
          <Button onClick={handleCreateNew}>Create New Comparison</Button>
        </div>
      </div>
    );
  }

  const currentComparison = data[currentIndex];
  const hasNextComparison = currentIndex < data.length - 1;
  const allVoted = data.every(comp => votedComparisons.has(comp.id));

  return (
    <div className="container mx-auto py-8">
      <VoteHeader />
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-gray-500">
            Comparison {currentIndex + 1} of {data.length}
          </span>
        </div>
        <div className="flex gap-2">
          {hasNextComparison && (
            <Button onClick={handleNext} variant="outline">
              Next Comparison
            </Button>
          )}
          <Button onClick={handleCreateNew} variant="default">
            Create New
          </Button>
        </div>
      </div>
      
      {currentComparison && (
        <VoteComparison
          comparison={currentComparison}
          onVote={handleVote}
          hasVoted={votedComparisons.has(currentComparison.id)}
        />
      )}
      
      {allVoted && (
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">You've voted on all available comparisons!</p>
          <Button onClick={handleCreateNew}>Create New Comparison</Button>
        </div>
      )}
    </div>
  );
};

export default Vote;
