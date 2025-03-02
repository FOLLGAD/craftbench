import SceneRenderer from "@/components/SceneRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVote } from "@/hooks/use-vote";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	getComparison,
	getComparisonVotes,
	getModelRatings,
	getVote,
} from "../../lib/models";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Skeleton } from "../ui/skeleton";

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

	const generations = useMemo(
		() =>
			[comparison.data?.generation_a, comparison.data?.generation_b]
				.filter(Boolean)
				.sort(() => Math.random() - 0.5),
		[comparison.data],
	);
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

	const adminCode = localStorage.getItem("admin_code") === "true";

	const winner: string | "tie" | null = useMemo(() => {
		const genAid = generations[0]?.id;
		const genBid = generations[1]?.id;

		if (!genAid || !genBid) return null;

		const aVotes = comparisonVotes.data?.[genAid] || 0;
		const bVotes = comparisonVotes.data?.[genBid] || 0;
		if (aVotes === bVotes) return "tie";
		return aVotes > bVotes ? genAid : genBid;
	}, [comparisonVotes.data, generations]);

	return (
		<div className="mb-8 shadow-lg rounded-lg p-4 border border-gray-200 bg-white">
			{comparison.data ? (
				<>
					<div className="mb-6 py-0 text-center">
						<p className="text-gray-700 text-2xl font-semibold">
							"{comparison.data?.prompt.trim()}"
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{generations.map((generation, index) => (
							<div
								key={generation.id}
								className={`${hasVoted && comparisonVotes.data?.[generation.id] > 0 ? "border-green-500" : "border-gray-200"}`}
							>
								<div className="flex flex-col justify-between items-center mb-4 w-full">
									<div className="w-full flex items-center gap-2">
										<h3 className="text-xl font-bold">
											{hasVoted
												? formatModelName(generation.model_name)
												: `Model ${index + 1}`}
										</h3>

										{winner === generation.id && (
											<Badge variant="default" className="bg-green-800">
												Winner
											</Badge>
										)}

										{winner === "tie" && <Badge variant="secondary">Tie</Badge>}

										{!!adminCode && (
											<Dialog>
												<DialogTrigger asChild>
													<Button variant="outline">Code</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Code</DialogTitle>
													</DialogHeader>
													<DialogDescription>
														<Textarea
															className="w-full h-[300px] resize-none"
															value={generation.generated_code}
															readOnly
														/>
													</DialogDescription>
												</DialogContent>
											</Dialog>
										)}
									</div>
									{hasVoted && modelRatings.data?.[generation.model_name] && (
										<div className="flex items-center gap-2 justify-between w-full">
											<p className="text-sm text-gray-600">
												Elo: {modelRatings.data[generation.model_name]}
											</p>

											<Badge
												variant={
													comparisonVotes.data?.[generation.id] > 0
														? "default"
														: "outline"
												}
												className="flex-shrink-0"
											>
												{getVotePercentage(generation.id)}% (
												{comparisonVotes.data?.[generation.id] || 0} votes)
											</Badge>
										</div>
									)}
								</div>

								<div className="bg-gray-800 rounded-md mb-6 h-[300px] overflow-hidden">
									<SceneRenderer
										code={generation.generated_code}
										generationId={generation.id}
									/>
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
				</>
			) : (
				<div className="flex flex-col gap-4">
					<Skeleton className="w-96 h-12 rounded-md mx-auto" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<Skeleton className="w-full h-8 rounded-md" />
							<Skeleton className="w-full h-[300px] rounded-md" />
						</div>

						<div className="flex flex-col gap-2">
							<Skeleton className="w-full h-8 rounded-md" />
							<Skeleton className="w-full h-[300px] rounded-md" />
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default VoteComparison;
