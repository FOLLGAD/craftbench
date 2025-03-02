
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
import { useVote } from "@/hooks/use-vote";

// Types moved to a separate file for reuse
import { Comparison } from "@/types/comparison";

const Vote = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { votedComparisons, handleVote } = useVote();
  const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(null);

  // Perform anonymous sign-in when the component loads
  useEffect(() => {
    const signInAnonymously = async () => {
      console.log("--- Authentication Check ---");
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log("No active session, signing in anonymously");
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          
          if (error) {
            console.error("Anonymous sign-in error:", error.message);
            toast({
              title: "Authentication Error",
              description: "Failed to create anonymous session. Some features may not work.",
              variant: "destructive",
            });
          } else {
            console.log("Anonymous sign-in successful. User ID:", data.user?.id);
            console.log("Session:", data.session);
          }
        } catch (e) {
          console.error("Unexpected error during anonymous sign-in:", e);
        }
      } else {
        console.log("Using existing session");
        console.log("Session user ID:", sessionData.session.user.id);
        console.log("Session expires at:", new Date(sessionData.session.expires_at * 1000).toISOString());
      }

      // Log current user regardless of path
      const { data: currentUser } = await supabase.auth.getUser();
      console.log("Current authenticated user ID:", currentUser.user?.id);
    };

    signInAnonymously();
  }, [toast]);

  // Fetch comparisons that have at least one vote
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["votable-comparisons"],
    queryFn: fetchVotableComparisons,
  });

  // Select a random unvoted comparison when data changes or after voting
  useEffect(() => {
    if (data && data.length > 0) {
      selectRandomUnvotedComparison();
    }
  }, [data, votedComparisons]);

  // Function to select a random unvoted comparison
  const selectRandomUnvotedComparison = () => {
    if (!data || data.length === 0) return;
    
    // Filter out comparisons that have already been voted on
    const unvotedComparisons = data.filter(
      comparison => !votedComparisons.has(comparison.id)
    );
    
    if (unvotedComparisons.length === 0) {
      // All comparisons have been voted on
      setCurrentComparisonId(null);
      return;
    }
    
    // Select a random comparison from the unvoted ones
    const randomIndex = Math.floor(Math.random() * unvotedComparisons.length);
    const randomComparison = unvotedComparisons[randomIndex];
    setCurrentComparisonId(randomComparison.id);
  };

  // Handle vote submission
  const handleVoteSubmission = async (
    comparisonId: string,
    generationId: string
  ) => {
    const success = await handleVote(comparisonId, generationId);
    if (success) {
      refetch();
    }
  };

  // Fetch another random unvoted comparison
  const handleNext = () => {
    selectRandomUnvotedComparison();
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

  // Find the current comparison
  const currentComparison = currentComparisonId 
    ? data.find(comp => comp.id === currentComparisonId)
    : null;
  
  // Check if there are any unvoted comparisons
  const hasUnvotedComparisons = data.some(comp => !votedComparisons.has(comp.id));

  return (
    <div className="container mx-auto py-8">
      <VoteHeader />
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-gray-500">
            {hasUnvotedComparisons 
              ? "Vote on this random comparison" 
              : "All comparisons voted"}
          </span>
        </div>
        <div className="flex gap-2">
          {hasUnvotedComparisons && (
            <Button onClick={handleNext} variant="outline">
              Next Random Comparison
            </Button>
          )}
          <Button onClick={handleCreateNew} variant="default">
            Create New
          </Button>
        </div>
      </div>
      
      {currentComparison ? (
        <VoteComparison
          comparison={currentComparison}
          onVote={handleVoteSubmission}
          hasVoted={votedComparisons.has(currentComparison.id)}
        />
      ) : (
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">You've voted on all available comparisons!</p>
          <Button onClick={handleCreateNew}>Create New Comparison</Button>
        </div>
      )}
    </div>
  );
};

// Extracted the data fetching logic into a separate function
async function fetchVotableComparisons(): Promise<Comparison[]> {
  // Debug user ID - log the current user ID
  const { data: userData } = await supabase.auth.getUser();
  console.log("Current User ID:", userData.user?.id);
  
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
  console.log("User ID for checking votes:", userId);

  // Get all votes in a single query
  const { data: allVotes, error: votesError } = await supabase
    .from("mc-votes")
    .select("comparison_id, generation_id, user_id");

  if (votesError) throw new Error(votesError.message);
  console.log("All votes:", allVotes);

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
}

export default Vote;
