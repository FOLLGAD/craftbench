
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/compare/LoadingState";
import ErrorState from "@/components/compare/ErrorState";
import VoteComparison from "@/components/vote/VoteComparison";
import { useVote } from "@/hooks/use-vote";
import { Comparison } from "@/types/comparison";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { votedComparisons, handleVote } = useVote();
  
  // Add state for displaying the latest comparison
  const [latestComparisonId, setLatestComparisonId] = useState<string | null>(null);

  // Perform anonymous sign-in when the component loads
  useEffect(() => {
    const signInAnonymously = async () => {
      console.log("--- Authentication Check (Index) ---");
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
      console.log("Current authenticated user ID in Index:", currentUser.user?.id);
    };

    signInAnonymously();

    // Fetch the latest comparison ID
    const fetchLatestComparison = async () => {
      const { data, error } = await supabase
        .from("mc-comparisons")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setLatestComparisonId(data[0].id);
      }
    };
    
    fetchLatestComparison();
  }, [toast]);

  // Fetch the latest comparison for voting
  const { data: comparison, isLoading, error, refetch } = useQuery({
    queryKey: ["latest-comparison", latestComparisonId],
    enabled: !!latestComparisonId,
    queryFn: async (): Promise<Comparison | null> => {
      if (!latestComparisonId) return null;
      
      // Get the specific comparison
      const { data: comparisonData, error: comparisonError } = await supabase
        .from("mc-comparisons")
        .select("id, prompt, generation_a_id, generation_b_id")
        .eq("id", latestComparisonId)
        .single();

      if (comparisonError) throw new Error(comparisonError.message);
      if (!comparisonData) return null;

      // Get the generations for this comparison
      const generationIds = [comparisonData.generation_a_id, comparisonData.generation_b_id];
      
      const { data: generations, error: generationsError } = await supabase
        .from("mc-generations")
        .select("*")
        .in("id", generationIds);

      if (generationsError) throw new Error(generationsError.message);

      // Get the votes for this comparison
      const { data: votes, error: votesError } = await supabase
        .from("mc-votes")
        .select("comparison_id, generation_id, user_id")
        .eq("comparison_id", latestComparisonId);

      if (votesError) throw new Error(votesError.message);

      // Get the current user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      console.log("Current User ID for latest comparison:", userId);

      // Check if the user has already voted
      const hasVoted = userId && (votes || []).some(
        vote => vote.user_id === userId
      );
      
      console.log(`Has user ${userId} voted on latest comparison?`, hasVoted);

      // Count votes per generation
      const voteCounts: { [key: string]: number } = {};
      (votes || []).forEach(vote => {
        const genId = vote.generation_id;
        if (!voteCounts[genId]) voteCounts[genId] = 0;
        voteCounts[genId] += 1;
      });

      return {
        id: comparisonData.id,
        generation_a_id: comparisonData.generation_a_id,
        generation_b_id: comparisonData.generation_b_id,
        prompt: comparisonData.prompt,
        generations: generations || [],
        voted: hasVoted,
        votes: voteCounts
      };
    }
  });

  const handleVoteSubmission = async (
    comparisonId: string,
    generationId: string
  ) => {
    const success = await handleVote(comparisonId, generationId);
    if (success) {
      // Refresh the data to get updated vote counts
      refetch();
    }
  };

  const handleViewAllComparisons = () => {
    navigate("/vote");
  };

  const handleCreateNew = () => {
    navigate("/");
  };

  const handleResetError = () => {
    refetch();
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={(error as Error).message} onReset={handleResetError} />;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Model Comparisons</h1>
      
      {comparison ? (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Latest Comparison</h2>
            <div className="flex gap-2">
              <Button onClick={handleViewAllComparisons} variant="outline">
                View All Comparisons
              </Button>
              <Button onClick={handleCreateNew}>
                Create New Comparison
              </Button>
            </div>
          </div>
          
          <VoteComparison
            comparison={comparison}
            onVote={handleVoteSubmission}
            hasVoted={votedComparisons.has(comparison.id)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-4">No comparisons available</h2>
          <p className="text-gray-600 mb-6">Create a new comparison to get started.</p>
          <Button onClick={handleCreateNew}>Create New Comparison</Button>
        </div>
      )}
    </div>
  );
};

export default Index;
