
import Footer from "@/components/common/Footer";
import Header from "@/components/compare/Header";
import VoteComparison from "@/components/vote/VoteComparison";
import CommentSection from "@/components/comments/CommentSection";
import { useParams } from "react-router-dom";

export default function Compare() {
	const { comparisonId } = useParams();

	return (
		<div className="flex flex-col gap-4">
			<Header />
			<VoteComparison comparisonId={comparisonId} />
			
			{comparisonId && (
				<div className="container max-w-7xl mx-auto px-4">
					<CommentSection comparisonId={comparisonId} />
				</div>
			)}

			<div className="flex-1" />

			<Footer />
		</div>
	);
}
