import ErrorState from "@/components/compare/ErrorState";
import Header from "@/components/compare/Header";
import LoadingState from "@/components/compare/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VoteComparison from "@/components/vote/VoteComparison";
import { useGenerate } from "@/hooks/use-generate";
import { supabase } from "@/integrations/supabase/client";
import type { Comparison } from "@/types/comparison";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 5;

const Home = () => {
	const navigate = useNavigate();
	const [prompt, setPrompt] = useState("");
	const [currentPage, setCurrentPage] = useState(0);

	// Fetch recent comparisons with pagination
	const {
		data: comparisons,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["recent-comparisons", currentPage],
		queryFn: async (): Promise<Comparison[]> => {
			// Get paginated comparisons
			const { data: comparisonData, error: comparisonError } = await supabase
				.from("mc-comparisons")
				.select("id, prompt, generation_a_id, generation_b_id, created_at")
				.order("created_at", { ascending: false })
				.range(
					currentPage * ITEMS_PER_PAGE,
					(currentPage + 1) * ITEMS_PER_PAGE - 1,
				);

			if (comparisonError) throw new Error(comparisonError.message);
			if (!comparisonData?.length) return [];

			// Get all generation IDs from the comparisons
			const generationIds = comparisonData.flatMap((comp) => [
				comp.generation_a_id,
				comp.generation_b_id,
			]);

			// Get all the generations in one query
			const { data: generations, error: generationsError } = await supabase
				.from("mc-generations")
				.select("*")
				.in("id", generationIds);

			if (generationsError) throw new Error(generationsError.message);

			// Get votes for these comparisons
			const { data: votes, error: votesError } = await supabase
				.from("mc-votes")
				.select("comparison_id, generation_id, user_id");

			if (votesError) throw new Error(votesError.message);

			// Get current user
			const { data: userData } = await supabase.auth.getUser();
			const userId = userData.user?.id;

			// Process each comparison
			return comparisonData.map((comp) => {
				// Find the generations for this comparison
				const compGenerations = (generations || []).filter(
					(gen) =>
						gen.id === comp.generation_a_id || gen.id === comp.generation_b_id,
				);

				// Count votes per generation for this comparison
				const votesByGeneration: Record<string, number> = {};
				for (const vote of votes || []) {
					if (vote.comparison_id === comp.id) {
						votesByGeneration[vote.generation_id] =
							(votesByGeneration[vote.generation_id] || 0) + 1;
					}
				}

				// Check if user has already voted on this comparison
				const hasVoted =
					userId &&
					(votes || []).some(
						(vote) => vote.comparison_id === comp.id && vote.user_id === userId,
					);

				return {
					id: comp.id,
					prompt: comp.prompt,
					generation_a_id: comp.generation_a_id,
					generation_b_id: comp.generation_b_id,
					generations: compGenerations,
					voted: hasVoted,
					votes: votesByGeneration,
				};
			});
		},
	});
	const { generate } = useGenerate();

	// Handler for navigation to Compare page
	const handleCreateComparison = async () => {
		if (prompt.trim()) {
			const comparison = await generate(prompt);
			if (comparison) {
				navigate(`/compare?comparisonId=${comparison.id}`);
			}
		} else {
			navigate("/");
		}
	};

	// Handle pagination
	const goToNextPage = () => {
		setCurrentPage((prev) => prev + 1);
	};

	const goToPrevPage = () => {
		setCurrentPage((prev) => Math.max(0, prev - 1));
	};

	// Error handler
	const handleError = () => {
		refetch();
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />

			<main className="container mx-auto px-4 py-8">
				{/* Hero Section with Prompt Input */}
				<section className="mb-12 pt-6">
					<div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
						<h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
							Compare AI Voxel Models
						</h1>

						<p className="text-gray-600 text-center mb-8">
							Enter a prompt to generate and compare voxel scenes with different
							AI models
						</p>

						<div className="relative">
							<Input
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								className="pr-16 py-6 text-lg rounded-full border-2 border-gray-300 focus-visible:ring-purple-500"
								placeholder="A small castle with towers and a moat..."
								onKeyDown={(e) => {
									if (e.key === "Enter" && prompt.trim()) {
										handleCreateComparison();
									}
								}}
							/>
							<div className="absolute right-0 top-0 bottom-0 h-full flex items-center justify-center pr-1.5">
								<Button
									onClick={handleCreateComparison}
									disabled={!prompt.trim()}
									className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-full"
									aria-label="Generate with models"
								>
									<Sparkles className="mr-2" /> Generate
								</Button>
							</div>
						</div>
					</div>
				</section>

				{/* Recent Comparisons Section */}
				<section>
					<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-gray-800">
								Recent Comparisons
							</h2>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={goToPrevPage}
									disabled={currentPage === 0 || isLoading}
								>
									<ArrowLeft className="h-4 w-4" />
								</Button>
								<span className="text-sm text-gray-500">
									Page {currentPage + 1}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={goToNextPage}
									disabled={
										!comparisons ||
										comparisons.length < ITEMS_PER_PAGE ||
										isLoading
									}
								>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{isLoading ? (
							<LoadingState />
						) : error ? (
							<ErrorState
								error={(error as Error).message}
								onReset={handleError}
							/>
						) : !comparisons || comparisons.length === 0 ? (
							<div className="text-center py-12">
								<p className="text-gray-500 mb-4">No comparisons found</p>
								<Button
									onClick={handleCreateComparison}
									disabled={!prompt.trim()}
								>
									Create Your First Comparison
								</Button>
							</div>
						) : (
							<div className="space-y-8">
								{comparisons.map((comparison) => (
									<VoteComparison
										key={comparison.id}
										comparisonId={comparison.id}
									/>
								))}
							</div>
						)}
					</div>
				</section>
			</main>
		</div>
	);
};

export default Home;
