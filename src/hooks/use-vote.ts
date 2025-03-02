
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useVote = () => {
  const [votedComparisons, setVotedComparisons] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleVote = async (
    comparisonId: string,
    generationId: string
  ) => {
    try {
      console.log("--- Vote Submission Process ---");
      
      // Step 1: Get the current user ID
      const { data: userData } = await supabase.auth.getUser();
      console.log("Initial user check:", userData);
      console.log("Initial user ID:", userData.user?.id);
      
      let userId = userData.user?.id;
      
      // Step 2: Validate that we have a user ID before proceeding
      if (!userId) {
        console.error("User ID is null, attempting anonymous sign-in");
        
        // Try to sign in anonymously if we don't have a user ID
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
          
          if (signInError) {
            console.error("Anonymous sign-in error details:", signInError);
            throw new Error("Failed to create user session: " + signInError.message);
          }
          
          // Log the newly created user
          console.log("Sign-in response:", signInData);
          userId = signInData.user?.id;
          
          if (!userId) {
            throw new Error("Failed to create user ID for voting - user ID still null after sign-in");
          }
          
          console.log("Created new anonymous user for voting:", userId);
        } catch (e) {
          console.error("Detailed error during emergency sign-in:", e);
          throw new Error("Authentication error: " + (e instanceof Error ? e.message : String(e)));
        }
      }
      
      // Step 3: Get the latest user ID to be absolutely sure we have it
      const { data: latestUserData, error: latestUserError } = await supabase.auth.getUser();
      
      if (latestUserError) {
        console.error("Error getting latest user:", latestUserError);
        throw new Error("Failed to verify user: " + latestUserError.message);
      }
      
      console.log("Latest user data:", latestUserData);
      const latestUserId = latestUserData.user?.id;
      
      if (!latestUserId) {
        console.error("Latest user ID is still null after all attempts");
        throw new Error("Unable to get valid user ID for voting");
      }
      
      console.log("Final confirmed user ID for voting:", latestUserId);
      console.log("Comparison ID:", comparisonId);
      console.log("Generation ID:", generationId);
      
      // Step 4: Log the current session for debugging
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Current session before voting:", sessionData);
      
      // Step 5: Insert the vote with the validated user ID
      console.log("Inserting vote with user ID:", latestUserId);
      const { data: voteData, error } = await supabase.from("mc-votes").insert({
        comparison_id: comparisonId,
        generation_id: generationId,
        vote: 1,
        user_id: latestUserId  // Always use the validated user ID
      }).select();

      if (error) {
        console.error("Vote insert error details:", error);
        throw error;
      }
      
      console.log("Vote inserted successfully:", voteData);

      // Update local state to mark this comparison as voted
      setVotedComparisons(prev => new Set([...prev, comparisonId]));
      
      toast({
        title: "Vote recorded",
        description: "Thanks for your vote!",
      });

      return true;
    } catch (error: any) {
      console.error("Vote error details:", error);
      
      // Log any specific database error information
      if (error.code && error.details) {
        console.error(`Database error code: ${error.code}`);
        console.error(`Error details: ${error.details}`);
        console.error(`Error hint: ${error.hint}`);
      }
      
      toast({
        title: "Error",
        description: `Failed to record vote: ${error.message}`,
        variant: "destructive",
      });

      return false;
    }
  };

  return {
    votedComparisons,
    setVotedComparisons,
    handleVote
  };
};
