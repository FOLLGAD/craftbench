import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as THREE from "three";
// @ts-expect-error dasdas
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { materialManager } from "../utils/materials";
interface SceneRendererProps {
  code: string;
  generationId?: string;
}
const getPositionKey = (x: number, y: number, z: number) => `${x},${y},${z}`;
class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  geometries = [];
  blockPositions = new Map<string, THREE.InstancedMesh>();
  userInteracted = false;
  autoRotateAngle = 0;
  animationFrameId?: number;
  pendingUpdates = new Map<string, {
    position: [number, number, number];
    blockType: string;
  }>();
  constructor(canvas: HTMLCanvasElement) {
    // Initialize material manager
    materialManager.initialize();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.camera.position.set(20, 10, 20);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // // 3-point lighting
    const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(50, -50, 50);
    this.scene.add(light1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-50, -50, -50);
    this.scene.add(light2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, -50, 50);
    directionalLight.castShadow = false;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);

    // Start animation loop
    this.animate();
  }
  handleResize = () => {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  };
  animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Auto-rotate camera around the scene if user hasn't interacted
    if (!this.userInteracted) {
      // Increment the angle (0.005 radians per frame is a slow rotation)
      this.autoRotateAngle += 0.005;

      // Calculate new camera position in a circle around the center
      const radius = Math.sqrt(this.camera.position.x ** 2 + this.camera.position.z ** 2);
      this.camera.position.x = radius * Math.sin(this.autoRotateAngle);
      this.camera.position.z = radius * Math.cos(this.autoRotateAngle);

      // Keep the camera looking at the center
      this.camera.lookAt(0, 0, 0);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
  removeBlocksAtPositions(positions: string[]) {
    // Track which meshes need updating
    const meshesToUpdate = new Set<THREE.InstancedMesh>();
    for (const pos of positions) {
      const mesh = this.blockPositions.get(pos);
      if (mesh) {
        // Find the instance index for this position
        for (let i = 0; i < mesh.count; i++) {
          const matrix = new THREE.Matrix4();
          mesh.getMatrixAt(i, matrix);
          const position = new THREE.Vector3();
          position.setFromMatrixPosition(matrix);
          const key = getPositionKey(position.x, position.y, position.z);
          if (key === pos) {
            // Move the last instance to this position if it's not the last one
            if (i < mesh.count - 1) {
              const lastMatrix = new THREE.Matrix4();
              mesh.getMatrixAt(mesh.count - 1, lastMatrix);
              mesh.setMatrixAt(i, lastMatrix);

              // Update the position mapping for the moved instance
              const lastPosition = new THREE.Vector3();
              lastPosition.setFromMatrixPosition(lastMatrix);
              const lastKey = getPositionKey(lastPosition.x, lastPosition.y, lastPosition.z);
              this.blockPositions.set(lastKey, mesh);
            }

            // Reduce the instance count
            mesh.count--;
            meshesToUpdate.add(mesh);
            this.blockPositions.delete(pos);

            // If no instances left, remove the mesh entirely
            if (mesh.count === 0) {
              this.scene.remove(mesh);
              const index = this.geometries.indexOf(mesh);
              if (index > -1) {
                this.geometries.splice(index, 1);
              }
            }
            break;
          }
        }
      }
    }

    // Update modified meshes
    for (const mesh of meshesToUpdate) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  MAX_BOUNDS = 50;
  setBlock(x: number, y: number, z: number, blockType: string) {
    if (x < -this.MAX_BOUNDS || x > this.MAX_BOUNDS || y < -this.MAX_BOUNDS || y > this.MAX_BOUNDS || z < -this.MAX_BOUNDS || z > this.MAX_BOUNDS) return;
    const posKey = getPositionKey(x, y, z);
    this.pendingUpdates.set(posKey, {
      position: [x, y, z],
      blockType
    });
  }
  fill(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, blockType: string) {
    const xs = Math.min(x1, x2);
    const xe = Math.max(x1, x2);
    const ys = Math.min(y1, y2);
    const ye = Math.max(y1, y2);
    const zs = Math.min(z1, z2);
    const ze = Math.max(z1, z2);
    for (let x = Math.max(xs, -this.MAX_BOUNDS); x <= Math.min(xe, this.MAX_BOUNDS); x++) {
      for (let y = Math.max(ys, -this.MAX_BOUNDS); y <= Math.min(ye, this.MAX_BOUNDS); y++) {
        for (let z = Math.max(zs, -this.MAX_BOUNDS); z <= Math.min(ze, this.MAX_BOUNDS); z++) {
          const posKey = getPositionKey(x, y, z);
          this.pendingUpdates.set(posKey, {
            position: [x, y, z],
            blockType
          });
        }
      }
    }
  }
  applyPendingUpdates() {
    // Group blocks by material type for efficient instanced mesh creation
    const blocksByMaterial = new Map<string, {
      positions: [number, number, number][];
      posKeys: string[];
    }>();

    // First, collect all positions that need to be removed
    const positionsToRemove = new Set<string>();
    for (const [posKey] of this.pendingUpdates) {
      positionsToRemove.add(posKey);
    }

    // Remove existing blocks at these positions
    this.removeBlocksAtPositions(Array.from(positionsToRemove));

    // Group blocks by material
    for (const [posKey, {
      position,
      blockType
    }] of this.pendingUpdates) {
      if (blockType.toLowerCase() === "air") continue;
      const materialBlocks = blocksByMaterial.get(blockType.toLowerCase()) || {
        positions: [],
        posKeys: []
      };
      materialBlocks.positions.push(position);
      materialBlocks.posKeys.push(posKey);
      blocksByMaterial.set(blockType.toLowerCase(), materialBlocks);
    }

    // Create instanced meshes for each material type
    for (const [blockType, {
      positions,
      posKeys
    }] of blocksByMaterial) {
      const material = materialManager.getMaterial(blockType);
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const instancedMesh = new THREE.InstancedMesh(geometry, material, positions.length);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      const matrix = new THREE.Matrix4();
      positions.forEach((pos, index) => {
        matrix.setPosition(pos[0], pos[1], pos[2]);
        instancedMesh.setMatrixAt(index, matrix);
        this.blockPositions.set(posKeys[index], instancedMesh);
      });
      instancedMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(instancedMesh);
      this.geometries.push(instancedMesh);
    }

    // Clear pending updates
    this.pendingUpdates.clear();
  }
  dispose() {
    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose of all geometries and materials to prevent memory leaks
    for (const mesh of this.geometries) {
      if (mesh.geometry) mesh.geometry.dispose();
      this.scene.remove(mesh);
    }

    // Clear arrays and maps
    this.geometries.length = 0;
    this.blockPositions.clear();
    this.pendingUpdates.clear();

    // Clean up all remaining objects from the scene
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      object.clear();
      this.scene.remove(object);
    }

    // Final renderer and controls disposal
    this.renderer.dispose();
    this.controls.dispose();
  }
  clearBlocks() {
    this.removeBlocksAtPositions(Array.from(this.blockPositions.keys()));
  }
}
export const SceneRenderer = ({
  code,
  generationId
}: SceneRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [inited, setInited] = useState(false);

  // Update canvas size based on container size
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current || !sceneManagerRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();

    // Only update if size actually changed
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      sceneManagerRef.current.handleResize();
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();

    // Set initial size
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = rect.width;
    canvas.height = rect.height;
    const sceneManager = new SceneManager(canvas);
    sceneManagerRef.current = sceneManager;

    // Add event listeners to detect user interaction
    const handleUserInteraction = () => {
      sceneManager.userInteracted = true;
    };
    sceneManager.renderer.domElement.addEventListener("pointerdown", handleUserInteraction);
    sceneManager.renderer.domElement.addEventListener("wheel", handleUserInteraction);
    sceneManager.renderer.domElement.addEventListener("touchstart", handleUserInteraction);

    // Use ResizeObserver for more accurate size updates
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", updateCanvasSize);
    setInited(true);
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      resizeObserver.disconnect();
      sceneManager.renderer.domElement.removeEventListener("pointerdown", handleUserInteraction);
      sceneManager.renderer.domElement.removeEventListener("wheel", handleUserInteraction);
      sceneManager.renderer.domElement.removeEventListener("touchstart", handleUserInteraction);
      sceneManager.dispose();
    };
  }, [updateCanvasSize]);
  const executeCode = useCallback(() => {
    if (!sceneManagerRef.current) {
      toast.error("3D renderer not initialized yet");
      return;
    }
    try {
      // Prepare functions to be called from worker
      const workerFunctionsSetup = `
				function setBlock(x, y, z, blockType) {
					self.postMessage({ 
						action: 'setBlock', 
						params: { x, y, z, blockType } 
					});
				}
				
				function fill(x1, y1, z1, x2, y2, z2, blockType) {
					self.postMessage({ 
						action: 'fill', 
						params: { x1, y1, z1, x2, y2, z2, blockType } 
					});
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
      const blob = new Blob([workerCode], {
        type: "application/javascript"
      });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      // Set timeout to terminate worker (5 seconds)
      const timeoutId = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        console.error("Error: Code execution timed out");
        posthog.capture("code_execution_timeout", {
          code,
          generationId
        });
      }, 1000);
      const queue = [];

      // Listen for messages from worker
      worker.onmessage = e => {
        const data = e.data;
        if (data.action === "setBlock") {
          const {
            x,
            y,
            z,
            blockType
          } = data.params;
          queue.push(["setBlock", x, y, z, blockType]);
        } else if (data.action === "fill") {
          const {
            x1,
            y1,
            z1,
            x2,
            y2,
            z2,
            blockType
          } = data.params;
          queue.push(["fill", x1, y1, z1, x2, y2, z2, blockType]);
        } else if (data.action === "complete") {
          clearTimeout(timeoutId);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          for (const fn of queue) {
            if (fn[0] === "setBlock") {
              sceneManagerRef.current?.setBlock(...(fn.slice(1) as [number, number, number, string]));
            } else if (fn[0] === "fill") {
              sceneManagerRef.current?.fill(...(fn.slice(1) as [number, number, number, number, number, number, string]));
            }
          }
          // Apply all pending updates at once after all blocks have been queued
          sceneManagerRef.current?.applyPendingUpdates();
        } else if (data.action === "error") {
          clearTimeout(timeoutId);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          toast.error(`Error: ${data.message}`);
          console.error("Error in worker:", data.message);
        }
      };

      // Start the worker
      worker.postMessage("start");
    } catch (error) {
      console.error("Error executing code:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    sceneManagerRef.current.handleResize();
  }, [code, generationId]);

  // Execute user code whenever code changes
  useEffect(() => {
    if (inited && code) {
      executeCode();
    }
    return () => {
      sceneManagerRef.current?.clearBlocks();
    };
  }, [inited, code, executeCode]);
  return <div ref={containerRef} className="h-full w-full flex items-center justify-center bg-gray-50 rounded-md overflow-hidden shadow-inner">
			<canvas ref={canvasRef} style={{
      width: "100%",
      height: "100%"
    }} />
		</div>;
};

// Wrapper that only renders the scene when it's visible on screen
export const VisibleScreenRenderer = ({
  code,
  generationId
}: SceneRendererProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, {
      threshold: 0.4 // Trigger when at least 40% is visible
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);
  return <div ref={containerRef}>
			{isVisible && <SceneRenderer code={code} generationId={generationId} />}
		</div>;
};
