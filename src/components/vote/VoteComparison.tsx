
import { Badge } from "@/components/ui/badge";
import SceneRenderer from "@/components/SceneRenderer";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";

type Generation = {
  id: string;
  prompt: string;
  model_name: string;
  generated_code: string;
};

type Comparison = {
  id: string;
  generation_a_id: string;
  generation_b_id: string;
  prompt: string;
  generations: Generation[];
  voted: boolean;
  votes: {
    [key: string]: number;
  };
};

interface VoteComparisonProps {
  comparison: Comparison;
  onVote: (comparisonId: string, generationId: string) => void;
  hasVoted: boolean;
}

const VoteComparison = ({ comparison, onVote, hasVoted }: VoteComparisonProps) => {
  // Format the model name to be more readable
  const formatModelName = (modelName: string) => {
    // Remove organization prefix (e.g., "anthropic/", "openai/")
    const withoutOrg = modelName.split('/').pop() || modelName;
    
    // Replace dashes with spaces and capitalize first letter of each word
    return withoutOrg
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate total votes for percentage display
  const totalVotes = Object.values(comparison.votes).reduce((sum, count) => sum + count, 0);
  
  // Calculate vote percentage for a generation
  const getVotePercentage = (genId: string) => {
    const voteCount = comparison.votes[genId] || 0;
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h2 className="text-xl font-bold mb-2">Prompt</h2>
        <p className="text-gray-700">{comparison.prompt}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparison.generations.map((generation, index) => (
          <div
            key={generation.id}
            className={`bg-white rounded-lg shadow-lg border p-6 ${
              hasVoted && comparison.votes[generation.id] > 0 
                ? "border-green-500" 
                : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {hasVoted 
                  ? formatModelName(generation.model_name) 
                  : `Model ${index + 1}`}
              </h3>
              
              {hasVoted && (
                <Badge variant={comparison.votes[generation.id] > 0 ? "default" : "outline"}>
                  {getVotePercentage(generation.id)}% ({comparison.votes[generation.id] || 0} votes)
                </Badge>
              )}
            </div>

            <div className="bg-gray-800 rounded-md mb-6 h-[300px] overflow-hidden">
              <SceneRenderer code={generation.generated_code} />
            </div>

            <Button
              onClick={() => onVote(comparison.id, generation.id)}
              disabled={hasVoted}
              variant={hasVoted && comparison.votes[generation.id] > 0 ? "default" : "outline"}
              className={`w-full ${
                hasVoted && comparison.votes[generation.id] > 0 
                  ? "bg-green-600 hover:bg-green-700" 
                  : ""
              }`}
            >
              {hasVoted && comparison.votes[generation.id] > 0 ? (
                <>
                  <ThumbsUp className="mr-2 h-5 w-5" /> Voted!
                </>
              ) : hasVoted ? (
                "Thanks for voting!"
              ) : (
                "Vote for this generation"
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteComparison;
