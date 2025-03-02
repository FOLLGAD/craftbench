import SceneRenderer from "@/components/SceneRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp } from "lucide-react";
import { useState } from "react";
import {
	getComparison,
	getComparisonVotes,
	getModelRatings,
	getVote,
} from "../../lib/models";
import { useVote } from "@/hooks/use-vote";
import { toast } from "sonner";

interface VoteComparisonProps {
	comparisonId: string;
	isVoting?: boolean;
}

const VoteComparison = ({
	comparisonId,
	isVoting: externalIsVoting = false,
}: VoteComparisonProps) => {
	const queryClient = useQueryClient();
	const [isVoting, setIsVoting] = useState(externalIsVoting);

	const { handleVote } = useVote();

	const { data: voteData } = useQuery({
		queryKey: ["vote", comparisonId],
		queryFn: async () => {
			const { data } = await supabase.auth.getUser();
			if (!data?.user?.id) return { generationId: null };
			return getVote(comparisonId, data.user.id);
		},
		enabled: true,
	});
	const myVote = voteData?.generationId;
	const hasVoted = !!myVote;

	const onVote = async (comparisonId: string, generationId: string) => {
		try {
			setIsVoting(true);
			await handleVote(comparisonId, generationId);
			queryClient.invalidateQueries({ queryKey: ["vote", comparisonId] });
			queryClient.invalidateQueries({
				queryKey: ["comparison-votes", comparisonId],
			});
			toast.success("Vote submitted");
		} catch (error) {
			console.error("Error voting:", error);
			toast.error("Failed to submit vote");
		} finally {
			setIsVoting(false);
		}
	};

	// Format the model name to be more readable
	const formatModelName = (modelName: string) => {
		return modelName;
	};

	const comparison = useQuery({
		queryKey: ["comparison", comparisonId],
		queryFn: () => getComparison(comparisonId),
	});

	const comparisonVotes = useQuery({
		queryKey: ["comparison-votes", comparisonId],
		queryFn: () => getComparisonVotes(comparisonId),
	});

	const generations = [
		comparison.data?.generation_a,
		comparison.data?.generation_b,
	].filter(Boolean);
	const modelNames = generations.map((gen) => gen.model_name);

	const modelRatings = useQuery({
		queryKey: ["model-ratings", ...modelNames],
		queryFn: () => getModelRatings(modelNames),
		enabled: !!modelNames.length && !!myVote,
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
				<p className="text-gray-700 text-2xl font-semibold">
					{comparison.data?.prompt}
				</p>
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
							onClick={() => onVote(comparisonId, generation.id)}
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
