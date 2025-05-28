
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/compare/Header";
import Footer from "@/components/common/Footer";
import { useGenerate } from "@/hooks/use-generate";
import { Loader2 } from "lucide-react";

const Generate = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const { generate } = useGenerate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    try {
      const comparison = await generate(prompt);
      if (comparison) {
        navigate(`/compare/${comparison.id}`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate comparison");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Generate New Comparison</h1>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                  Enter your prompt (max 120 characters)
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 120))}
                  placeholder="e.g., Create a medieval castle with towers"
                  className="min-h-[100px]"
                  maxLength={120}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {prompt.length}/120 characters
                </div>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Comparison"
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Generate;
