
import { Button } from "@/components/ui/button";
import GenerationCard from "./GenerationCard";

interface Generation {
  id: string;
  prompt: string;
  model_name: string;
  generated_code: string;
}

interface ResultsSectionProps {
  generations: Generation[];
  shuffledOrder: number[];
  selectedGeneration: number | null;
  hasVoted: boolean;
  comparisonId: string;
  onVote: (index: number, comparisonId: string) => void;
  onReset: () => void;
}

const ResultsSection = ({
  generations,
  shuffledOrder,
  selectedGeneration,
  hasVoted,
  comparisonId,
  onVote,
  onReset,
}: ResultsSectionProps) => {
  if (generations.length !== 2) {
    return null;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Comparison Results</h2>
        <Button variant="outline" className="text-sm" onClick={onReset}>
          New Comparison
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((index) => (
          <GenerationCard
            key={index}
            index={index}
            generation={generations[shuffledOrder[index]]}
            isSelected={selectedGeneration === index}
            hasVoted={hasVoted}
            comparisonId={comparisonId}
            onVote={onVote}
          />
        ))}
      </div>
    </>
  );
};

export default ResultsSection;
