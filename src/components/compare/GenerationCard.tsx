
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import SceneRenderer from "@/components/SceneRenderer";

interface GenerationCardProps {
  index: number;
  generation: {
    id: string;
    prompt: string;
    model_name: string;
    generated_code: string;
  };
  isSelected: boolean;
  hasVoted: boolean;
  onVote: (index: number) => void;
}

const GenerationCard = ({ index, generation, isSelected, hasVoted, onVote }: GenerationCardProps) => {
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
  
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border p-6 ${
        isSelected ? "border-green-500 ring-2 ring-green-500" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">
          {hasVoted ? formatModelName(generation.model_name) : `Model ${index + 1}`}
        </h3>
      </div>

      <div className="bg-gray-800 rounded-md mb-6">
        <SceneRenderer code={generation.generated_code} />
      </div>

      <Button
        onClick={() => onVote(index)}
        disabled={hasVoted}
        variant={isSelected ? "default" : "outline"}
        className={`w-full ${isSelected ? "bg-green-600 hover:bg-green-700" : ""}`}
      >
        {isSelected ? (
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
  );
};

export default GenerationCard;
