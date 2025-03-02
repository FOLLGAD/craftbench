import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DEFAULT_CODE_PROMPT, HOUSE_EXAMPLE, PYRAMID_EXAMPLE, CASTLE_EXAMPLE } from "@/constants/codeExamples";
import SceneRenderer from "@/components/SceneRenderer";
import { useNavigate } from "react-router-dom";
const Playground = () => {
  const [code, setCode] = useState(DEFAULT_CODE_PROMPT);
  const navigate = useNavigate();

  // Clear all blocks from the scene
  const clearBlocks = () => {
    setCode("");
  };
  return <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      <header className="bg-black text-white p-4 shadow-md z-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold">McLovin ❤️</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-300 hidden md:block">Build your blocky world with code</p>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" onClick={() => navigate("/")}>
              Compare Models
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-col lg:flex-row h-full gap-6 p-6">
        {/* Left side - Code editor */}
        <div className="w-full lg:w-1/3 flex flex-col gap-5">
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5 overflow-hidden">
            <h2 className="text-xl font-bold mb-3 text-gray-800">JavaScript Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use <code className="bg-gray-100 px-2 py-1 rounded font-mono text-purple-700">setBlock(x, y, z, "block-name")</code> and <code className="bg-gray-100 px-2 py-1 rounded font-mono text-purple-700">fill(x1, y1, z1, x2, y2, z2, "block-name")</code> to build your scene.
            </p>
            
            <Textarea value={code} onChange={e => setCode(e.target.value)} className="font-mono text-sm h-[300px] resize-none bg-gray-50 border-gray-300 focus:border-purple-400 focus:ring-purple-300" placeholder="// Enter your code here" />
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => setCode(code)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-200 shadow-md">
              Run Code
            </Button>
            
            <Button onClick={clearBlocks} variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100">
              Clear Scene
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Block Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {["grass", "stone", "dirt", "wood", "water", "sand", "glass", "gold", "cobblestone", "brick", "leaves", "bedrock", "air"].map(block => <div key={block} className="flex items-center gap-2 bg-gray-50 p-3 rounded-md cursor-pointer hover:bg-gray-100 border border-gray-200 transition-all duration-150 shadow-sm" onClick={() => setCode(code => `${code}\nsetBlock(0, 0, 0, '${block}');`)}>
                  <div className="w-6 h-6 rounded" style={{
                backgroundColor: block === "grass" ? "#3bca2b" : block === "stone" ? "#969696" : block === "dirt" ? "#8b4513" : block === "wood" ? "#8b4513" : block === "water" ? "#1e90ff" : block === "sand" ? "#ffef8f" : block === "glass" ? "#ffffff" : block === "gold" ? "#FFD700" : block === "cobblestone" ? "#555555" : block === "brick" ? "#b22222" : block === "leaves" ? "#2d8c24" : block === "bedrock" ? "#221F26" : block === "air" ? "transparent" : "#ff00ff",
                border: block === "air" ? "2px dashed rgba(0,0,0,0.3)" : "2px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }} />
                  <span className="text-sm font-medium capitalize">{block}</span>
                </div>)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Example Code</h2>
            <div className="space-y-3">
              <pre onClick={() => setCode(HOUSE_EXAMPLE)} className="bg-gray-50 p-3 rounded-md text-xs cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm font-mono px-0 py-0">{`
                // Create a small house
                fill(0, 0, 0, 6, 0, 6, 'stone');
                fill(0, 1, 0, 6, 3, 0, 'wood');
                // ... more code
              `}</pre>
              
              <pre onClick={() => setCode(PYRAMID_EXAMPLE)} className="bg-gray-50 p-3 rounded-md text-xs cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm font-mono px-0 py-0">{`
                // Create a pyramid
                const size = 10;
                for (let y = 0; y < size; y++) {
                  const width = size - y;
                  fill(-width, y, -width, width, y, width, 'sand');
                }
              `}</pre>
              
              <pre onClick={() => setCode(CASTLE_EXAMPLE)} className="bg-gray-50 p-3 rounded-md text-xs cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm font-mono px-0 py-0 ml-0">{`
                // Create a castle with new blocks
                fill(-5, 0, -5, 5, 0, 5, 'cobblestone');
                // ... castle walls, towers, and more
              `}</pre>
            </div>
          </div>
        </div>
        
        {/* Right side - 3D view */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5 h-full">
            <h2 className="text-xl font-bold mb-3 text-gray-800">3D View</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click and drag to rotate. Scroll to zoom in/out. Build your voxel world with code!
            </p>
            <SceneRenderer code={code} />
          </div>
        </div>
      </div>
    </div>;
};
export default Playground;