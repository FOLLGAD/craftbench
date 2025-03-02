import VoteComparison from "@/components/vote/VoteComparison";
import { useParams } from "react-router-dom";

export default function Compare() {
	const { comparisonId } = useParams();

	return (
		<div>
			<VoteComparison comparisonId={comparisonId} />
		</div>
	);
}
