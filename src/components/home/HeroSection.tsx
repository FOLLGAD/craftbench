import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
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
  return <section className="mb-12 pt-6 w-full flex justify-center text-white">
      <div className="max-w-3xl sm:p-8 w-full">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary">
          Benchcraft
        </h1>

        <div className="relative">
          <Input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A small castle with towers and a moat..." disabled={creatingComparison} onKeyDown={e => {
          if (e.key === "Enter" && prompt.trim() && !creatingComparison) {
            handleCreateComparison();
          }
        }} className="pr-16 py-6 text-base rounded-full border-2 border-border focus-visible:ring-primary mb-4 pl-6" />
          <div className="sm:absolute right-0 top-0 bottom-0 h-full flex items-center justify-center pr-1.5">
            <Button onClick={handleCreateComparison} disabled={!prompt.trim() || creatingComparison} aria-label="Generate with models" className="text-primary-foreground rounded-full bg-primary hover:bg-primary/90">
              {creatingComparison ? <>
                  <Loader2 className="mr-2 animate-spin" />
                  Generating...
                </> : <>
                  <Sparkles className="mr-2" />
                  Generate
                </>}
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;