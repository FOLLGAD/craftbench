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
  return <section className="mb-12 pt-6 w-full flex justify-center">
			<div className="max-w-3xl sm:p-8 w-full">
				<h1 className="text-4xl font-bold mb-6 text-center text-green-900">
					Benchcraft
				</h1>

				<div className="relative">
					<Input value={prompt} onChange={e => setPrompt(e.target.value)} className="pr-16 py-6 text-lg rounded-full border-2 border-gray-300 focus-visible:ring-green-700 mb-4" placeholder="A small castle with towers and a moat..." onKeyDown={e => {
          if (e.key === "Enter" && prompt.trim()) {
            handleCreateComparison();
          }
        }} />
					<div className="sm:absolute right-0 top-0 bottom-0 h-full flex items-center justify-center pr-1.5">
						<Button onClick={handleCreateComparison} disabled={!prompt.trim() || creatingComparison} aria-label="Generate with models" className="text-white rounded-full bg-lime-950 hover:bg-lime-800">
							<Sparkles className="mr-2" />{" "}
							{creatingComparison ? "Generating..." : "Generate"}
						</Button>
					</div>
				</div>
			</div>
		</section>;
};
export default HeroSection;