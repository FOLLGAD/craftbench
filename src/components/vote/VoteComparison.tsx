import SceneRenderer from "@/components/SceneRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Comparison } from "@/types/comparison";
import { useQuery } from "@tanstack/react-query";
import { ThumbsUp } from "lucide-react";

interface VoteComparisonProps {
	comparison: Comparison;
	onVote: (comparisonId: string, generationId: string) => void;
	hasVoted: boolean;
	isVoting?: boolean;
}

const getVote = async (comparisonId: string, userId: string) => {
	const { data, error } = await supabase
		.from("mc-votes")
		.select("generation_id")
		.eq("comparison_id", comparisonId)
		.eq("user_id", userId);
	if (error) {
		throw new Error(error.message);
	}
	return {
		generationId: data[0]?.generation_id,
	};
};

const getComparisonVotes = async (comparison: Comparison) => {
	const { data, error } = await supabase
		.from("mc-votes")
		.select("generation_id")
		.eq("comparison_id", comparison.id);
	if (error) {
		throw new Error(error.message);
	}
	const votes = data.reduce(
		(acc, vote) => {
			acc[vote.generation_id] = (acc[vote.generation_id] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
	return votes;
};

const getComparison = async (comparisonId: string) => {
	const { data, error } = await supabase
		.from("mc-comparisons")
		.select(`*,
      generation_a:"mc-generations"!generation_a_id(*),
      generation_b:"mc-generations"!generation_b_id(*)
    `)
		.eq("id", comparisonId);
	if (error) {
		throw new Error(error.message);
	}
	return data[0];
};

const getModelRatings = async (modelNames: string[]) => {
	if (!modelNames.length) return {};

	const { data, error } = await supabase
		.from("mc-models")
		.select("model_name, elo")
		.in("model_name", modelNames);

	if (error) {
		throw new Error(error.message);
	}

	return data.reduce(
		(acc, model) => {
			acc[model.model_name] = model.elo;
			return acc;
		},
		{} as Record<string, number>,
	);
};

const VoteComparison = ({
	comparison: c,
	onVote,
	hasVoted,
	isVoting = false,
}: VoteComparisonProps) => {
	const { data: voteData } = useQuery({
		queryKey: ["vote", c.id, hasVoted ? "voted" : "not-voted"],
		queryFn: async () => {
			const { data } = await supabase.auth.getUser();
			if (!data?.user?.id) return { generationId: null };
			return getVote(c.id, data.user.id);
		},
		enabled: true,
	});
	const myVote = voteData?.generationId;

	// Format the model name to be more readable
	const formatModelName = (modelName: string) => {
		return modelName;
	};

	const comparison = useQuery({
		queryKey: ["comparison", c.id],
		queryFn: () => getComparison(c.id),
	});

	const comparisonVotes = useQuery({
		queryKey: ["comparison-votes", c.id, hasVoted ? "voted" : "not-voted"],
		queryFn: () => getComparisonVotes(c),
	});

	const generations = [
		comparison.data?.generation_a,
		comparison.data?.generation_b,
	].filter(Boolean);
	const modelNames = generations.map((gen) => gen.model_name);

	const modelRatings = useQuery({
		queryKey: ["model-ratings", ...modelNames],
		queryFn: () => getModelRatings(modelNames),
		enabled: !!modelNames.length && hasVoted,
	});

	const totalVotes = Object.values(comparisonVotes.data || {}).reduce(
		(sum, count) => sum + count,
		0,
	);

	const getVotePercentage = (genId: string) => {
		const voteCount = comparisonVotes.data?.[genId] || 0;
		if (totalVotes === 0) return 0;
		return Math.round((voteCount / totalVotes) * 100);
	};

	return (
		<div className="mb-8">
			<div className="mb-6 p-4 py-0">
				<p className="text-gray-700 text-2xl font-semibold">{c.prompt}</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{generations.map((generation, index) => (
					<div
						key={generation.id}
						className={`bg-white rounded-lg shadow-lg border p-6 ${hasVoted && comparisonVotes.data?.[generation.id] > 0 ? "border-green-500" : "border-gray-200"}`}
					>
						<div className="flex justify-between items-center mb-4">
							<div>
								<h3 className="text-xl font-bold">
									{hasVoted
										? formatModelName(generation.model_name)
										: `Model ${index + 1}`}
								</h3>
								{hasVoted && modelRatings.data?.[generation.model_name] && (
									<p className="text-sm text-gray-600">
										Elo: {modelRatings.data[generation.model_name]}
									</p>
								)}
							</div>

							{hasVoted && (
								<Badge
									variant={
										comparisonVotes.data?.[generation.id] > 0
											? "default"
											: "outline"
									}
								>
									{getVotePercentage(generation.id)}% (
									{comparisonVotes.data?.[generation.id] || 0} votes)
								</Badge>
							)}
						</div>

						<div className="bg-gray-800 rounded-md mb-6 h-[300px] overflow-hidden">
							<SceneRenderer code={generation.generated_code} />
						</div>

						<Button
							onClick={() => onVote(c.id, generation.id)}
							disabled={hasVoted || isVoting}
							variant={myVote ? "default" : "outline"}
							className={`w-full ${myVote === generation.id ? "bg-green-600 hover:bg-green-700" : ""}`}
						>
							{isVoting ? (
								"Voting..."
							) : myVote === generation.id ? (
								<>
									<ThumbsUp className="mr-2 h-5 w-5" /> Voted!
								</>
							) : (
								"Vote for this generation"
							)}
						</Button>
					</div>
				))}
			</div>
		</div>
	);
};

export default VoteComparison;
