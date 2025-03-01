
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon, ThumbsUp } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border p-6 ${
        isSelected ? "border-green-500 ring-2 ring-green-500" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Model {index + 1}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyCode(generation.generated_code)}
          className="flex items-center gap-2"
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="bg-gray-50 p-4 rounded-md mb-6 overflow-auto max-h-64">
        <pre className="text-sm font-mono whitespace-pre-wrap">
          {generation.generated_code}
        </pre>
      </div>

      <div className="h-64 bg-gray-800 rounded-md mb-6">
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
