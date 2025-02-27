
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DEFAULT_CODE_PROMPT, HOUSE_EXAMPLE, PYRAMID_EXAMPLE } from "@/constants/codeExamples";

const Index = () => {
  const [code, setCode] = useState(DEFAULT_CODE_PROMPT);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Import Three.js dynamically to avoid SSR issues
    import('three').then(THREE => {
      import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        // Camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        
        // Renderer
        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true
        });
        renderer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.7);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);
        
        // Store scene reference
        sceneRef.current = { 
          scene, 
          camera, 
          renderer, 
          controls, 
          blocks: new Map(), 
          THREE 
        };
        
        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        
        animate();
        
        // Handle window resize
        const handleResize = () => {
          if (!canvasRef.current) return;
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.7);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          renderer.dispose();
          controls.dispose();
          
          // Clean up all meshes from the scene
          while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
          }
        };
      });
    });
  }, []);
  
  // Execute user code
  const executeCode = () => {
    if (!sceneRef.current) {
      toast.error("3D renderer not initialized yet");
      return;
    }
    
    setIsRunning(true);
    
    try {
      // Clear previous blocks
      clearBlocks();
      
      // Create context with our functions
      const fill = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, blockType: string) => {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
              setBlock(x, y, z, blockType);
            }
          }
        }
      };
      
      const setBlock = (x: number, y: number, z: number, blockType: string) => {
        const { scene, blocks, THREE } = sceneRef.current;
        const key = `${x},${y},${z}`;
        
        // Remove existing block at this position
        if (blocks.has(key)) {
          scene.remove(blocks.get(key));
        }
        
        // Create new block
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let material;
        
        // Apply different colors/textures based on block type
        switch(blockType.toLowerCase()) {
          case 'grass':
            material = new THREE.MeshStandardMaterial({ color: 0x3bca2b });
            break;
          case 'stone':
            material = new THREE.MeshStandardMaterial({ color: 0x969696 });
            break;
          case 'dirt':
            material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            break;
          case 'wood':
            material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            break;
          case 'water':
            material = new THREE.MeshStandardMaterial({ 
              color: 0x1e90ff,
              transparent: true,
              opacity: 0.7
            });
            break;
          case 'sand':
            material = new THREE.MeshStandardMaterial({ color: 0xffef8f });
            break;
          case 'glass':
            material = new THREE.MeshStandardMaterial({ 
              color: 0xffffff,
              transparent: true,
              opacity: 0.3
            });
            break;
          case 'gold':
            material = new THREE.MeshStandardMaterial({ 
              color: 0xFFD700,
              metalness: 0.7,
              roughness: 0.2
            });
            break;
          default:
            material = new THREE.MeshStandardMaterial({ color: 0xff00ff }); // Magenta for unknown blocks
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene and store reference
        scene.add(mesh);
        blocks.set(key, mesh);
      };
      
      // Execute the code in context with our functions
      new Function('setBlock', 'fill', code)(setBlock, fill);
      
      toast.success("Code executed successfully");
    } catch (error) {
      console.error("Error executing code:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Clear all blocks from the scene
  const clearBlocks = () => {
    if (!sceneRef.current) return;
    
    const { scene, blocks } = sceneRef.current;
    
    // Remove all block meshes from the scene
    blocks.forEach(mesh => {
      scene.remove(mesh);
    });
    
    // Clear the blocks map
    blocks.clear();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      <header className="bg-black text-white p-4 shadow-md z-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voxel Sculptor</h1>
        <p className="text-sm text-gray-300">Build your blocky world with code</p>
      </header>
      
      <div className="flex flex-col lg:flex-row h-full gap-6 p-6">
        {/* Left side - Code editor */}
        <div className="w-full lg:w-1/3 flex flex-col gap-5">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5 overflow-hidden">
            <h2 className="text-xl font-bold mb-3 text-gray-800">JavaScript Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use <code className="bg-gray-100 px-2 py-1 rounded font-mono text-purple-700">setBlock(x, y, z, "block-name")</code> and <code className="bg-gray-100 px-2 py-1 rounded font-mono text-purple-700">fill(x1, y1, z1, x2, y2, z2, "block-name")</code> to build your scene.
            </p>
            
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm h-[300px] resize-none bg-gray-50 border-gray-300 focus:border-purple-400 focus:ring-purple-300"
              placeholder="// Enter your code here"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={executeCode} 
              disabled={isRunning}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-200 shadow-md"
            >
              {isRunning ? "Running..." : "Run Code"}
            </Button>
            
            <Button 
              onClick={clearBlocks} 
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Clear Scene
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Block Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {["grass", "stone", "dirt", "wood", "water", "sand", "glass", "gold"].map(block => (
                <div 
                  key={block}
                  className="flex items-center gap-2 bg-gray-50 p-3 rounded-md cursor-pointer hover:bg-gray-100 border border-gray-200 transition-all duration-150 shadow-sm"
                  onClick={() => setCode(code => `${code}\nsetBlock(0, 0, 0, '${block}');`)}
                >
                  <div 
                    className="w-6 h-6 rounded" 
                    style={{ 
                      backgroundColor: 
                        block === "grass" ? "#3bca2b" : 
                        block === "stone" ? "#969696" : 
                        block === "dirt" ? "#8b4513" : 
                        block === "wood" ? "#8b4513" : 
                        block === "water" ? "#1e90ff" : 
                        block === "sand" ? "#ffef8f" : 
                        block === "glass" ? "#ffffff" : 
                        block === "gold" ? "#FFD700" : "#ff00ff",
                      border: "2px solid rgba(0,0,0,0.1)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  />
                  <span className="text-sm font-medium capitalize">{block}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Example Code</h2>
            <div className="space-y-3">
              <pre 
                className="bg-gray-50 p-3 rounded-md text-xs cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm font-mono"
                onClick={() => setCode(HOUSE_EXAMPLE)}
              >
                // Create a small house
                fill(0, 0, 0, 6, 0, 6, 'stone');
                fill(0, 1, 0, 6, 3, 0, 'wood');
                // ... more code
              </pre>
              
              <pre 
                className="bg-gray-50 p-3 rounded-md text-xs cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm font-mono"
                onClick={() => setCode(PYRAMID_EXAMPLE)}
              >
                // Create a pyramid
                const size = 10;
                for (let y = 0; y &lt; size; y++) {
                  const width = size - y;
                  fill(-width, y, -width, width, y, width, 'sand');
                }
              </pre>
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
            <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-md overflow-hidden border border-gray-200 shadow-inner">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
