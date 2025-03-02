
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useVote = () => {
	const [votedComparisons, setVotedComparisons] = useState<Set<string>>(
		new Set(),
	);
	const [isVoting, setIsVoting] = useState(false);

	const handleVote = async (comparisonId: string, generationId: string) => {
		if (isVoting) return false;
		
		try {
			setIsVoting(true);
			console.log("--- Vote Submission Process ---");

			// Step 1: Get the current user session and token
			const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
			
			if (sessionError) {
				console.error("Session error:", sessionError);
				throw new Error(`Failed to get user session: ${sessionError.message}`);
			}
			
			// We need the user's token for authorization
			const token = sessionData?.session?.access_token;
			let userId = sessionData?.session?.user?.id;

			// Step 2: Validate that we have a user ID before proceeding
			if (!userId) {
				console.error("User ID is null, attempting anonymous sign-in");

				// Try to sign in anonymously if we don't have a user ID
				try {
					const { data: signInData, error: signInError } =
						await supabase.auth.signInAnonymously();

					if (signInError) {
						console.error("Anonymous sign-in error details:", signInError);
						throw new Error(
							`Failed to create user session: ${signInError.message}`,
						);
					}

					// Log the newly created user
					console.log("Sign-in response:", signInData);
					userId = signInData.user?.id;
					
					// Get the token from the new session
					const { data: newSessionData } = await supabase.auth.getSession();
					const token = newSessionData?.session?.access_token;

					if (!userId || !token) {
						throw new Error(
							"Failed to create user ID for voting - user ID or token still null after sign-in",
						);
					}

					console.log("Created new anonymous user for voting:", userId);
				} catch (e) {
					console.error("Detailed error during emergency sign-in:", e);
					throw new Error(
						`Authentication error: ${e instanceof Error ? e.message : String(e)}`,
					);
				}
			}

			console.log("User ID for voting:", userId);
			console.log("Comparison ID:", comparisonId);
			console.log("Generation ID:", generationId);

			// Call the edge function to process the vote and update Elo ratings
			const response = await supabase.functions.invoke('vote-comparison', {
				body: { 
					comparisonId, 
					generationId 
				}
			});

			if (response.error) {
				console.error("Vote function error:", response.error);
				throw new Error(`Failed to process vote: ${response.error.message}`);
			}

			console.log("Vote processed successfully:", response.data);

			// Update local state to mark this comparison as voted
			setVotedComparisons((prev) => new Set([...prev, comparisonId]));

			toast.success("Vote recorded", {
				description: `${response.data.winningModelName} Elo: ${response.data.winnerElo}`,
			});

			return true;
		} catch (error) {
			console.error("Vote error details:", error);

			toast.error(`Failed to record vote: ${error.message}`);

			return false;
		} finally {
			setIsVoting(false);
		}
	};

	return {
		votedComparisons,
		setVotedComparisons,
		handleVote,
		isVoting,
	};
};
