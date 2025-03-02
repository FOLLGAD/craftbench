
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGenerate } from "@/hooks/use-generate";

const HeroSection = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [creatingComparison, setCreatingComparison] = useState(false);
  const {
    generate
  } = useGenerate();

  // Handler for navigation to Compare page
  const handleCreateComparison = async () => {
    if (prompt.trim()) {
      setCreatingComparison(true);
      const comparison = await generate(prompt);
      if (comparison) {
        navigate(`/compare/${comparison.id}`);
      }
      setCreatingComparison(false);
    }
  };
  
  return <section className="mb-12 pt-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-8 border border-gray-200">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Benchcraft</h1>

        <div className="relative">
          <Input value={prompt} onChange={e => setPrompt(e.target.value)} className="pr-16 py-6 text-lg rounded-full border-2 border-gray-300 focus-visible:ring-purple-500" placeholder="A small castle with towers and a moat..." onKeyDown={e => {
          if (e.key === "Enter" && prompt.trim()) {
            handleCreateComparison();
          }
        }} />
          <div className="absolute right-0 top-0 bottom-0 h-full flex items-center justify-center pr-1.5">
            <Button onClick={handleCreateComparison} disabled={!prompt.trim() || creatingComparison} className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-full" aria-label="Generate with models">
              <Sparkles className="mr-2" />{" "}
              {creatingComparison ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </section>;
};

export default HeroSection;
