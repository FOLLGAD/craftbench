import VoteComparison from "@/components/vote/VoteComparison";
import { useParams, useSearchParams } from "react-router-dom";

export default function Compare() {
	const [searchParams] = useSearchParams();
	const comparisonId = searchParams.get("comparisonId");

	return (
		<div>
			<VoteComparison comparisonId={comparisonId} />
		</div>
	);
}
