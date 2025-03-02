import Header from "@/components/compare/Header";
import VoteComparison from "@/components/vote/VoteComparison";
import { useParams } from "react-router-dom";

export default function Compare() {
	const { comparisonId } = useParams();

	return (
		<div>
			<Header />
			<VoteComparison comparisonId={comparisonId} />
		</div>
	);
}
