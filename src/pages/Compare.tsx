import Footer from "@/components/common/Footer";
import Header from "@/components/compare/Header";
import VoteComparison from "@/components/vote/VoteComparison";
import { useParams } from "react-router-dom";

export default function Compare() {
	const { comparisonId } = useParams();

	return (
		<div className="flex flex-col gap-4">
			<Header />
			<VoteComparison comparisonId={comparisonId} />

			<div className="flex-1" />

			<Footer />
		</div>
	);
}
