import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
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

			// Call the edge function to process the vote and update Elo ratings
			const response = await supabase.functions.invoke("vote-comparison", {
				body: {
					comparisonId,
					generationId,
				},
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
