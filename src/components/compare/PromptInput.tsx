
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generateCode: () => Promise<void>;
  isGenerating: boolean;
}

const PromptInput = ({ prompt, setPrompt, generateCode, isGenerating }: PromptInputProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Model Comparison</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe your voxel scene
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-32 text-lg p-4"
          placeholder="Example: A small castle with towers and a moat"
        />
      </div>

      <Button
        onClick={generateCode}
        disabled={isGenerating || !prompt}
        className="w-full py-6 text-lg bg-purple-600 hover:bg-purple-700"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
          </>
        ) : (
          "Generate with Two Models"
        )}
      </Button>
    </div>
  );
};

export default PromptInput;
