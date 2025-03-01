import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface SceneRendererProps {
  code: string;
}

interface SceneRef {
  scene: any;
  camera: any;
  renderer: any;
  controls: any;
  blocks: Map<string, any>;
  THREE: any;
  normalMaps: Map<string, any>;
}

const SceneRenderer = ({ code }: SceneRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneRef | null>(null);
  
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
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
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
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);
        
        // Grid helper removed from here
        
        // Pre-generated normal maps for each block type
        const normalMaps = new Map();
        
        // Function to generate normal maps with different characteristics
        const generateNormalMap = (color: number, pattern: 'noise' | 'grid' | 'smooth' | 'rough' | 'bumpy' = 'noise', intensity: number = 0.5) => {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          
          // Fill with base color
          ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
          ctx.fillRect(0, 0, 256, 256);
          
          // Add pattern based on type
          switch(pattern) {
            case 'grid':
              // Create grid pattern with higher contrast for normal maps
              const gridSize = 32;
              ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.9})`;
              ctx.lineWidth = 3;
              
              for (let i = 0; i <= 256; i += gridSize) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 256);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(256, i);
                ctx.stroke();
              }
              
              // Add embossed effect for better normal map appearance
              const imageData = ctx.getImageData(0, 0, 256, 256);
              const data = imageData.data;
              
              // Create embossed effect by manipulating neighboring pixels
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = 256;
              tempCanvas.height = 256;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.putImageData(imageData, 0, 0);
                
                // Apply emboss-like filter
                ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
                ctx.fillRect(0, 0, 256, 256);
                
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.drawImage(tempCanvas, 0, 0);
                
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowOffsetX = -2;
                ctx.shadowOffsetY = -2;
                ctx.drawImage(tempCanvas, 0, 0);
              }
              break;
              
            case 'rough':
              // Create rough texture with jagged lines
              ctx.strokeStyle = `rgba(0, 0, 0, ${intensity * 0.7})`;
              ctx.lineWidth = 2;
              
              for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                let x = 0;
                let y = Math.random() * 256;
                ctx.moveTo(x, y);
                
                while (x < 256) {
                  x += Math.random() * 20;
                  y += (Math.random() - 0.5) * 40;
                  ctx.lineTo(x, y);
                }
                ctx.stroke();
              }
              break;
              
            case 'bumpy':
              // Create bumpy texture with circles
              for (let i = 0; i < 100; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const radius = 5 + Math.random() * 15;
                const brightness = 50 + Math.random() * 150;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness}, ${intensity})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
              }
              break;
              
            case 'smooth':
              // Create smooth gradients
              for (let i = 0; i < 10; i++) {
                const x1 = Math.random() * 256;
                const y1 = Math.random() * 256;
                const x2 = Math.random() * 256;
                const y2 = Math.random() * 256;
                const r = 50 + Math.random() * 206;
                
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, `rgba(${r}, ${r}, ${r}, 0)`);
                gradient.addColorStop(0.5, `rgba(${r}, ${r}, ${r}, ${intensity * 0.5})`);
                gradient.addColorStop(1, `rgba(${r}, ${r}, ${r}, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 256, 256);
              }
              break;
              
            case 'noise':
            default:
              // Add randomized noise for normal map
              const pixels = ctx.getImageData(0, 0, 256, 256);
              const data = pixels.data;
              
              for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random() * intensity * 100;
                data[i] = Math.min(255, data[i] + noise);     // r
                data[i+1] = Math.min(255, data[i+1] + noise); // g
                data[i+2] = Math.min(255, data[i+2] + noise); // b
              }
              
              ctx.putImageData(pixels, 0, 0);
              
              // Add some additional dots for texture
              for (let i = 0; i < 5000; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const radius = 1 + Math.random() * 2;
                const brightness = Math.random() * 40;
                
                ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 128}, ${intensity * 0.5})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
              }
              break;
          }
          
          return new THREE.CanvasTexture(canvas);
        };
        
        // Pre-generate normal maps for each block type
        normalMaps.set('grass', generateNormalMap(0x3bca2b, 'bumpy', 0.7));
        normalMaps.set('stone', generateNormalMap(0x969696, 'rough', 0.9));
        normalMaps.set('dirt', generateNormalMap(0x8b4513, 'noise', 0.8));
        normalMaps.set('wood', generateNormalMap(0x8b4513, 'grid', 0.6));
        normalMaps.set('water', generateNormalMap(0x1e90ff, 'smooth', 0.3));
        normalMaps.set('sand', generateNormalMap(0xffef8f, 'noise', 0.5));
        normalMaps.set('glass', generateNormalMap(0xffffff, 'smooth', 0.2));
        normalMaps.set('gold', generateNormalMap(0xFFD700, 'bumpy', 0.8));
        normalMaps.set('cobblestone', generateNormalMap(0x555555, 'rough', 1.0));
        normalMaps.set('brick', generateNormalMap(0xb22222, 'grid', 0.8));
        normalMaps.set('leaves', generateNormalMap(0x2d8c24, 'bumpy', 0.6));
        normalMaps.set('bedrock', generateNormalMap(0x221F26, 'rough', 1.0));
        
        // Store scene reference
        sceneRef.current = { 
          scene, 
          camera, 
          renderer, 
          controls, 
          blocks: new Map(), 
          THREE,
          normalMaps
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
  
  // Execute user code whenever code changes
  useEffect(() => {
    if (sceneRef.current) {
      executeCode();
    }
  }, [code]);
  
  const executeCode = () => {
    if (!sceneRef.current) {
      toast.error("3D renderer not initialized yet");
      return;
    }
    
    try {
      // Clear previous blocks
      clearBlocks();
      
      // Prepare functions to be called from worker
      const workerFunctionsSetup = `
        function setBlock(x, y, z, blockType) {
          self.postMessage({ 
            action: 'setBlock', 
            params: { x, y, z, blockType } 
          });
        }
        
        function fill(x1, y1, z1, x2, y2, z2, blockType) {
          for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
              for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
                setBlock(x, y, z, blockType);
              }
            }
          }
        }
      `;
      
      // Create worker with user code
      const workerCode = `
        ${workerFunctionsSetup}
        
        self.onmessage = function() {
          try {
            ${code}
            self.postMessage({ action: 'complete', success: true });
          } catch (error) {
            self.postMessage({ action: 'error', message: error.message });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      // Set timeout to terminate worker (1 second)
      const timeoutId = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        toast.error("Error: Code execution timed out (max 1 second)");
        console.error("Error: Code execution timed out");
      }, 1000);
      
      // Listen for messages from worker
      worker.onmessage = (e) => {
        const data = e.data;
        
        if (data.action === 'setBlock') {
          const { x, y, z, blockType } = data.params;
          handleSetBlock(x, y, z, blockType);
        } 
        else if (data.action === 'complete') {
          clearTimeout(timeoutId);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          toast.success("Code executed successfully");
        }
        else if (data.action === 'error') {
          clearTimeout(timeoutId);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          toast.error(`Error: ${data.message}`);
          console.error("Error in worker:", data.message);
        }
      };
      
      // Start the worker
      worker.postMessage('start');
      
    } catch (error) {
      console.error("Error executing code:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handler for setBlock commands from worker
  const handleSetBlock = (x: number, y: number, z: number, blockType: string) => {
    if (!sceneRef.current) return;
    
    const { scene, blocks, THREE, normalMaps } = sceneRef.current;
    const key = `${x},${y},${z}`;
    
    // Skip if blockType is 'air'
    if (blockType.toLowerCase() === 'air') {
      // Remove existing block if there is one
      if (blocks.has(key)) {
        scene.remove(blocks.get(key));
        blocks.delete(key);
      }
      return;
    }
    
    // Remove existing block at this position
    if (blocks.has(key)) {
      scene.remove(blocks.get(key));
    }
    
    // Create new block
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    let material;
    let color;
    let roughness = 0.7;
    let metalness = 0.0;
    let normalScale = new THREE.Vector2(0.5, 0.5);
    let normalMap = null;
    
    // Apply different colors/textures based on block type
    switch(blockType.toLowerCase()) {
      case 'grass':
        color = 0x3bca2b;
        roughness = 0.9;
        normalScale.set(0.8, 0.8);
        break;
      case 'stone':
        color = 0x969696;
        roughness = 0.9;
        normalScale.set(1.0, 1.0);
        break;
      case 'dirt':
        color = 0x8b4513;
        roughness = 0.8;
        normalScale.set(0.7, 0.7);
        break;
      case 'wood':
        color = 0x8b4513;
        roughness = 0.6;
        normalScale.set(0.6, 0.6);
        break;
      case 'water':
        color = 0x1e90ff;
        roughness = 0.1;
        metalness = 0.2;
        normalScale.set(0.3, 0.3);
        break;
      case 'sand':
        color = 0xffef8f;
        roughness = 0.8;
        normalScale.set(0.5, 0.5);
        break;
      case 'glass':
        color = 0xffffff;
        roughness = 0.1;
        metalness = 0.1;
        normalScale.set(0.2, 0.2);
        break;
      case 'gold':
        color = 0xFFD700;
        roughness = 0.2;
        metalness = 0.8;
        normalScale.set(0.8, 0.8);
        break;
      case 'cobblestone':
        color = 0x555555;
        roughness = 1.0;
        normalScale.set(1.2, 1.2);
        break;
      case 'brick':
        color = 0xb22222;
        roughness = 0.8;
        normalScale.set(0.9, 0.9);
        break;
      case 'leaves':
        color = 0x2d8c24;
        roughness = 0.9;
        normalScale.set(0.6, 0.6);
        break;
      case 'bedrock':
        color = 0x221F26;
        roughness = 0.9;
        normalScale.set(1.5, 1.5);
        break;
      default:
        color = 0xff00ff; // Magenta for unknown blocks
    }
    
    // Get the pre-generated normal map
    normalMap = normalMaps.get(blockType.toLowerCase()) || normalMaps.get('stone');
    
    // Create material based on block type
    if (blockType.toLowerCase() === 'glass' || blockType.toLowerCase() === 'water') {
      material = new THREE.MeshPhysicalMaterial({ 
        color: color,
        transparent: true,
        opacity: blockType.toLowerCase() === 'glass' ? 0.3 : 0.7,
        roughness: roughness,
        metalness: metalness,
        normalMap: normalMap,
        normalScale: normalScale,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2
      });
    } else {
      material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: roughness,
        metalness: metalness,
        normalMap: normalMap,
        normalScale: normalScale
      });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add to scene and store reference
    scene.add(mesh);
    blocks.set(key, mesh);
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
    <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-md overflow-hidden border border-gray-200 shadow-inner">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
      />
    </div>
  );
};

export default SceneRenderer;
