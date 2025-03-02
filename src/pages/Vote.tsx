
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

  // Perform anonymous sign-in when the component loads
  useEffect(() => {
    const signInAnonymously = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Only sign in if no active session
      if (!sessionData.session) {
        console.log("No active session, signing in anonymously");
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
          console.error("Anonymous sign-in error:", error.message);
          toast({
            title: "Authentication Error",
            description: "Failed to create anonymous session. Some features may not work.",
            variant: "destructive",
          });
        } else {
          console.log("Anonymous sign-in successful:", data.user?.id);
        }
      } else {
        console.log("Using existing session for user:", sessionData.session.user.id);
      }
    };

    signInAnonymously();
  }, [toast]);

  // Fetch comparisons that have at least one vote
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["votable-comparisons"],
    queryFn: async () => {
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

      // Get all votes in a single query, explicitly selecting the columns we need
      // Avoid the GROUP BY error by not performing aggregation in the query
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
        
        console.log(`Votes for comparison ${comparison.id}:`, comparisonVotes);

        // Check if user has voted on this comparison
        const hasVoted = userId && comparisonVotes.some(
          vote => vote.user_id === userId
        );
        
        console.log(`Has user ${userId} voted on comparison ${comparison.id}?`, hasVoted);

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
      // Get the current user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      // Validate that we have a user ID before proceeding
      if (!userId) {
        console.error("User ID is null, cannot submit vote");
        // Try to sign in anonymously if we don't have a user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        
        if (signInError) {
          throw new Error("Failed to create user session: " + signInError.message);
        }
        
        // Use the newly created user ID
        if (!signInData.user?.id) {
          throw new Error("Failed to create user ID for voting");
        }
        
        console.log("Created new anonymous user for voting:", signInData.user.id);
      }
      
      // Get the latest user ID (either existing or newly created)
      const { data: latestUserData } = await supabase.auth.getUser();
      const latestUserId = latestUserData.user?.id;
      
      if (!latestUserId) {
        throw new Error("Unable to get valid user ID for voting");
      }
      
      console.log("Voting with user ID:", latestUserId);
      console.log("Comparison ID:", comparisonId);
      console.log("Generation ID:", generationId);
      
      // Log the current session to debug authentication issues
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Current session:", sessionData);
      
      // Insert the vote with the validated user ID
      const { data: voteData, error } = await supabase.from("mc-votes").insert({
        comparison_id: comparisonId,
        generation_id: generationId,
        vote: 1,
        user_id: latestUserId  // Always use the validated user ID
      }).select();

      if (error) {
        console.error("Vote insert error:", error);
        throw error;
      }
      
      console.log("Vote inserted successfully:", voteData);

      // Update local state to mark this comparison as voted
      setVotedComparisons(prev => new Set([...prev, comparisonId]));
      
      // Refresh the data to get updated vote counts
      refetch();
      
      toast({
        title: "Vote recorded",
        description: "Thanks for your vote!",
      });
    } catch (error: any) {
      console.error("Vote error details:", error);
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
