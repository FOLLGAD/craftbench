
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generateCode: () => Promise<void>;
  isGenerating: boolean;
}

const PromptInput = ({ prompt, setPrompt, generateCode, isGenerating }: PromptInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        generateCode();
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-3xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
        Compare AI Voxel Models
      </h2>
      
      <p className="text-gray-600 text-center mb-8">
        Enter a prompt to generate voxel scenes with different AI models
      </p>

      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-32 text-lg p-6 pr-16 rounded-xl border-2 border-gray-300 focus:border-purple-500 shadow-inner resize-none"
          placeholder="A small castle with towers and a moat surrounded by trees..."
          disabled={isGenerating}
        />
        <button
          onClick={generateCode}
          disabled={isGenerating || !prompt}
          className={`absolute right-4 bottom-4 p-3 rounded-full ${
            isGenerating || !prompt
              ? "bg-gray-200 text-gray-400"
              : "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
          }`}
          aria-label="Generate with two models"
        >
          <Sparkles size={24} className={isGenerating ? "animate-pulse" : ""} />
        </button>
      </div>

      {isGenerating && (
        <p className="text-center mt-4 text-purple-600 animate-pulse">
          Working on your scene...
        </p>
      )}
    </div>
  );
};

export default PromptInput;
