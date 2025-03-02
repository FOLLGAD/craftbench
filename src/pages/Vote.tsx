import ErrorState from "@/components/compare/ErrorState";
import LoadingState from "@/components/compare/LoadingState";
import { Button } from "@/components/ui/button";
import VoteComparison from "@/components/vote/VoteComparison";
import VoteHeader from "@/components/vote/VoteHeader";
import { useVote } from "@/hooks/use-vote";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

// Types moved to a separate file for reuse
import type { Comparison } from "@/types/comparison";

const Vote = () => {
	const navigate = useNavigate();
	const { votedComparisons, handleVote } = useVote();
	const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(
		null,
	);

	// Fetch comparisons that have at least one vote
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["votable-comparisons"],
		queryFn: fetchVotableComparisons,
	});

	// Function to select a random unvoted comparison
	const selectRandomUnvotedComparison = useCallback(async () => {
		const { data: userData } = await supabase.auth.getUser();
		const userId = userData.user?.id;

		if (!userId) return;

		const { data: votes } = await supabase
			.from("mc-votes")
			.select("comparison_id")
			.eq("user_id", userId);

		const { data: comparisons, error: comparisonsError } = await supabase
			.from("mc-comparisons")
			.select("id")
			.order("created_at", { ascending: false })
			.limit(50)
			.not(
				"id",
				"in",
				`(${votes?.map((vote) => vote.comparison_id).join(",")})`,
			);

		if (comparisonsError) throw new Error(comparisonsError.message);
		if (!comparisons || comparisons.length === 0) return;

		const randomIndex = Math.floor(Math.random() * comparisons.length);
		const randomComparison = comparisons[randomIndex];
		setCurrentComparisonId(randomComparison.id);
	}, []);

	// Handle vote submission
	const handleVoteSubmission = async (
		comparisonId: string,
		generationId: string,
	) => {
		handleVote(comparisonId, generationId);
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
	if (error)
		return (
			<ErrorState error={(error as Error).message} onReset={handleResetError} />
		);
	if (!data || data.length === 0) {
		return (
			<div className="container mx-auto py-8">
				<VoteHeader />
				<div className="flex flex-col items-center justify-center py-12">
					<h2 className="text-xl font-semibold mb-4">
						No comparisons available
					</h2>
					<p className="text-gray-600 mb-6">
						Create a new comparison to get started.
					</p>
					<Button onClick={handleCreateNew}>Create New Comparison</Button>
				</div>
			</div>
		);
	}

	// Find the current comparison
	const currentComparison = currentComparisonId
		? data.find((comp) => comp.id === currentComparisonId)
		: null;

	// Check if there are any unvoted comparisons
	const hasUnvotedComparisons = data.some(
		(comp) => !votedComparisons.has(comp.id),
	);

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
					<p className="text-gray-600 mb-4">
						You've voted on all available comparisons!
					</p>
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
	const generationIds = comparisons.flatMap((comparison) => [
		comparison.generation_a_id,
		comparison.generation_b_id,
	]);

	// Fetch all generations in a single query
	const { data: allGenerations, error: generationsError } = await supabase
		.from("mc-generations")
		.select("*")
		.in("id", generationIds);

	if (generationsError) throw new Error(generationsError.message);

	// Create a map of generation ids to generation objects for quick lookup
	const generationsMap = Object.fromEntries(
		(allGenerations || []).map((gen) => [gen.id, gen]),
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
	const comparisonData = comparisons.map((comparison) => {
		// Get both generations from the map
		const genA = generationsMap[comparison.generation_a_id];
		const genB = generationsMap[comparison.generation_b_id];

		// Filter votes for this comparison
		const comparisonVotes = (allVotes || []).filter(
			(vote) => vote.comparison_id === comparison.id,
		);

		// Check if user has voted on this comparison
		const hasVoted =
			userId && comparisonVotes.some((vote) => vote.user_id === userId);

		// Count votes per generation
		const voteCounts: { [key: string]: number } = {};
		for (const vote of comparisonVotes) {
			const genId = vote.generation_id;
			if (!voteCounts[genId]) voteCounts[genId] = 0;
			voteCounts[genId] += 1;
		}

		return {
			id: comparison.id,
			generation_a_id: comparison.generation_a_id,
			generation_b_id: comparison.generation_b_id,
			prompt: comparison.prompt,
			generations: [genA, genB].filter(Boolean),
			voted: !!hasVoted,
			votes: voteCounts,
		};
	});

	return comparisonData.filter((comp) => comp.generations.length === 2);
}

export default Vote;
