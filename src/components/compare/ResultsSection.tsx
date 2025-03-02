import { Button } from "@/components/ui/button";
import type { Comparison } from "@/types/comparison";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import VoteComparison from "../vote/VoteComparison";

interface Generation {
	id: string;
	prompt: string;
	model_name: string;
	generated_code: string;
}

interface ResultsSectionProps {
	comparison: Comparison;
	onVote: (comparisonId: string, generationId: string) => void;
	onReset: () => void;
	hasVoted: boolean;
}

const ResultsSection = ({
	comparison,
	onVote,
	onReset,
	hasVoted,
}: ResultsSectionProps) => {
	return (
		<>
			<div className="flex justify-between items-center mb-2">
				<h2 className="text-2xl font-bold text-gray-800">Comparison Results</h2>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link to="/vote">
							<ExternalLink className="mr-2 h-4 w-4" /> View All Comparisons
						</Link>
					</Button>
					<Button variant="outline" className="text-sm" onClick={onReset}>
						New Comparison
					</Button>
				</div>
			</div>
			<div className="">
				<VoteComparison
					comparison={comparison}
					onVote={onVote}
					hasVoted={hasVoted}
				/>
			</div>
		</>
	);
};

export default ResultsSection;
