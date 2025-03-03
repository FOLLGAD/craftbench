import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Header from "@/components/compare/Header";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { SceneRenderer } from "@/components/SceneRenderer";
import { useParams } from "react-router-dom";
import { useComparison } from "@/hooks/use-comparison";
const Generate = () => {
  const {
    comparisonId
  } = useParams();
  const {
    comparison,
    isLoading,
    error
  } = useComparison(comparisonId || "");
  const [winner, setWinner] = useState(null);
  useEffect(() => {
    if (comparison?.likes) {
      const modelNames = Object.keys(comparison.likes);
      if (modelNames.length > 0) {
        const winnerModel = modelNames.reduce((a, b) => comparison.likes[a] > comparison.likes[b] ? a : b);
        setWinner(winnerModel);
      }
    }
  }, [comparison]);
  if (isLoading) {
    return <div>
        <Header />
        <section className="mb-12 pt-6 w-full flex justify-center font-light text-white">
          <div className="max-w-3xl sm:p-8 w-full">
            <h1 className="text-4xl font-light mb-8 text-center text-white">
              Loading...
            </h1>
          </div>
        </section>
      </div>;
  }
  if (error) {
    return <div>
        <Header />
        <section className="mb-12 pt-6 w-full flex justify-center font-light text-white">
          <div className="max-w-3xl sm:p-8 w-full">
            <h1 className="text-4xl font-light mb-8 text-center text-white">
              Error: {error}
            </h1>
          </div>
        </section>
      </div>;
  }
  if (!comparison) {
    return <div>
        <Header />
        <section className="mb-12 pt-6 w-full flex justify-center font-light text-white">
          <div className="max-w-3xl sm:p-8 w-full">
            <h1 className="text-4xl font-light mb-8 text-center text-white">
              Comparison not found
            </h1>
          </div>
        </section>
      </div>;
  }
  return <div>
      <Header />
      <section className="mb-12 pt-6 w-full flex justify-center font-light text-white">
        <div className="max-w-5xl sm:p-8 w-full">
          <h1 className="text-2xl font-bold mb-8 text-left text-white">
            {comparison.prompt}
          </h1>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(comparison.images).map(([modelName, imageUrl]) => <div key={modelName} className="relative">
                <SceneRenderer url={imageUrl} />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white p-1 rounded-md text-sm">
                  {modelName}
                </div>
                {winner === modelName && <div className="absolute top-2 right-2 bg-yellow-500 text-black p-1 rounded-md text-sm">
                    Winner
                  </div>}
              </div>)}
          </div>
        </div>
      </section>
    </div>;
};
export default Generate;
