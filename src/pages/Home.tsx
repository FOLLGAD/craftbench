import ErrorState from "@/components/compare/ErrorState";
import Header from "@/components/compare/Header";
import LoadingState from "@/components/compare/LoadingState";
import Footer from "@/components/common/Footer";
import HeroSection from "@/components/home/HeroSection";
import { Button } from "@/components/ui/button";
import VoteComparison from "@/components/vote/VoteComparison";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import type { Comparison } from "@/types/comparison";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
const ITEMS_PER_PAGE_DESKTOP = 5;
const ITEMS_PER_PAGE_MOBILE = 1;
const Home = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const isMobile = useIsMobile();
  const maxItemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;

  // Fetch recent comparisons with pagination
  const {
    data: comparisons,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["recent-comparisons", currentPage, maxItemsPerPage],
    queryFn: async (): Promise<Comparison[]> => {
      // Get paginated comparisons
      const {
        data: comparisonData,
        error: comparisonError
      } = await supabase.from("mc-comparisons").select("id, prompt, generation_a_id, generation_b_id, created_at").order("created_at", {
        ascending: false
      }).range(currentPage * maxItemsPerPage, (currentPage + 1) * maxItemsPerPage - 1);
      if (comparisonError) throw new Error(comparisonError.message);
      if (!comparisonData?.length) return [];

      // Get all generation IDs from the comparisons
      const generationIds = comparisonData.flatMap(comp => [comp.generation_a_id, comp.generation_b_id]);

      // Get all the generations in one query
      const {
        data: generations,
        error: generationsError
      } = await supabase.from("mc-generations").select("*").in("id", generationIds);
      if (generationsError) throw new Error(generationsError.message);

      // Get votes for these comparisons
      const {
        data: votes,
        error: votesError
      } = await supabase.from("mc-votes").select("comparison_id, generation_id, user_id");
      if (votesError) throw new Error(votesError.message);

      // Get current user
      const {
        data: userData
      } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Process each comparison
      return comparisonData.map(comp => {
        // Find the generations for this comparison
        const compGenerations = (generations || []).filter(gen => gen.id === comp.generation_a_id || gen.id === comp.generation_b_id);

        // Count votes per generation for this comparison
        const votesByGeneration: Record<string, number> = {};
        for (const vote of votes || []) {
          if (vote.comparison_id === comp.id) {
            votesByGeneration[vote.generation_id] = (votesByGeneration[vote.generation_id] || 0) + 1;
          }
        }

        // Check if user has already voted on this comparison
        const hasVoted = userId && (votes || []).some(vote => vote.comparison_id === comp.id && vote.user_id === userId);
        return {
          id: comp.id,
          prompt: comp.prompt,
          generation_a_id: comp.generation_a_id,
          generation_b_id: comp.generation_b_id,
          generations: compGenerations,
          voted: hasVoted,
          votes: votesByGeneration
        };
      });
    }
  });

  // Handle pagination
  const goToNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  // Error handler
  const handleError = () => {
    refetch();
  };
  return <div className="min-h-screen bg-gray-50 flex flex-col px-1">
			<Header />

			<main className="md:px-4 py-8 flex-grow flex flex-col">
				<HeroSection />

				<section>
					<div className="mb-8">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-gray-800">
								Recent benches
							</h2>
							<div className="flex items-center gap-2">
								<Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 0 || isLoading}>
									<ArrowLeft className="h-4 w-4" />
								</Button>
								<span className="text-sm text-gray-500">
									Page {currentPage + 1}
								</span>
								<Button variant="outline" size="sm" onClick={goToNextPage} disabled={!comparisons || comparisons.length < maxItemsPerPage || isLoading}>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{isLoading ? <LoadingState /> : error ? <ErrorState error={(error as Error).message} onReset={handleError} /> : !comparisons || comparisons.length === 0 ? <div className="text-center py-12">
								<p className="text-gray-500 mb-4">No comparisons found</p>
								<Button onClick={() => document.querySelector("input")?.focus()} className="bg-green-800 hover:bg-green-900 text-white">
									Create Your First Comparison
								</Button>
							</div> : <div className="space-y-8">
								{comparisons.map(comparison => <VoteComparison key={comparison.id} comparisonId={comparison.id} />)}
							</div>}
					</div>
				</section>

				<section>
					<div className="flex justify-center">
						<Button variant="outline" size="lg" onClick={() => setCurrentPage(c => c + 1)} className="text-white hover:text-white text-xl py-6 px-12 bg-green-900 hover:bg-green-800">
							Next
						</Button>
					</div>
				</section>
			</main>

			<Footer />
		</div>;
};
export default Home;