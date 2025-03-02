import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as THREE from "three";
// @ts-expect-error dasdas
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { materialManager } from "../utils/materials";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

interface SceneRendererProps {
	code: string;
	generationId?: string;
}

interface SceneRef {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	controls: OrbitControls;
	blocks: Map<string, THREE.Mesh>;
	THREE: typeof THREE;
	animationFrameId?: number; // Added to track animation frame
}

const SceneRenderer = ({ code, generationId }: SceneRendererProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<SceneRef | null>(null);
	const [inited, setInited] = useState(false);

	useEffect(() => {
		console.log(code);
	}, [code]);

	// Initialize Three.js scene
	useEffect(() => {
		if (!canvasRef.current) return;

		// Initialize material manager
		materialManager.initialize();

		// Scene setup
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x87ceeb); // Sky blue background

		// Camera
		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		camera.position.set(10, 10, 10);
		camera.lookAt(0, 0, 0);

		// Renderer
		const renderer = new THREE.WebGLRenderer({
			canvas: canvasRef.current,
			antialias: true,
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

		// Store scene reference
		sceneRef.current = {
			scene,
			camera,
			renderer,
			controls,
			blocks: new Map(),
			THREE,
		};

		const animate = () => {
			const animationFrameId = requestAnimationFrame(animate);
			sceneRef.current.animationFrameId = animationFrameId;

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

		window.addEventListener("resize", handleResize);

		setInited(true);

		// Cleanup function for useEffect
		return () => {
			window.removeEventListener("resize", handleResize);

			// Cancel any pending animation frame
			if (sceneRef.current?.animationFrameId) {
				cancelAnimationFrame(sceneRef.current.animationFrameId);
			}

			// Dispose of all geometries and materials to prevent memory leaks
			if (sceneRef.current) {
				const { scene, blocks, renderer, controls } = sceneRef.current;

				// Dispose of all blocks (meshes, geometries)
				for (const mesh of blocks.values()) {
					if (mesh.geometry) mesh.geometry.dispose();
					scene.remove(mesh);
				}

				// Clear the blocks map
				blocks.clear();

				// Clean up all remaining objects from the scene
				while (scene.children.length > 0) {
					const object = scene.children[0];
					object.clear();
					scene.remove(object);
				}

				// Final renderer and controls disposal
				renderer.dispose();
				controls.dispose();

				// Clear the sceneRef to free memory
				sceneRef.current = null;
			}
		};
	}, []);

	// Handler for setBlock commands from worker
	const handleSetBlock = useCallback(
		(x: number, y: number, z: number, blockType: string) => {
			if (!sceneRef.current) return;

			const { scene, blocks } = sceneRef.current;
			const key = `${x},${y},${z}`;

			// Skip if blockType is 'air'
			if (blockType.toLowerCase() === "air") {
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

			// Get the material from the material manager
			const material = materialManager.getMaterial(blockType.toLowerCase());

			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(x, y, z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			// Add to scene and store reference
			scene.add(mesh);
			blocks.set(key, mesh);
		},
		[],
	);

	const handleFill = useCallback(
		(
			x1: number,
			y1: number,
			z1: number,
			x2: number,
			y2: number,
			z2: number,
			blockType: string,
		) => {
			if (!sceneRef.current) return;

			const { scene, blocks } = sceneRef.current;

			// Get the material from the material manager
			const material = materialManager.getMaterial(blockType.toLowerCase());

			// Create a single geometry for all blocks in the fill region
			const geometries: THREE.BoxGeometry[] = [];

			// Process blocks in reverse order to ensure later blocks are rendered "on top"
			// This affects the order in the merged geometry
			for (let x = Math.max(x1, x2); x >= Math.min(x1, x2); x--) {
				for (let y = Math.max(y1, y2); y >= Math.min(y1, y2); y--) {
					for (let z = Math.max(z1, z2); z >= Math.min(z1, z2); z--) {
						// Create geometry for this block
						const geometry = new THREE.BoxGeometry(1, 1, 1);

						// Translate the geometry to its position
						geometry.translate(x, y, z);

						// Add to geometries array
						geometries.push(geometry);
					}
				}
			}

			// Merge all geometries into one
			const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

			// Create a single mesh for all blocks
			const mesh = new THREE.Mesh(mergedGeometry, material);
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			// Add to scene
			scene.add(mesh);
		},
		[],
	);

	// Clear all blocks from the scene
	const clearBlocks = useCallback(() => {
		if (!sceneRef.current) return;

		const { scene, blocks } = sceneRef.current;

		// Remove all block meshes from the scene
		for (const mesh of blocks.values()) {
			scene.remove(mesh);
		}

		// Clear the blocks map
		blocks.clear();
	}, []);

	const executeCode = useCallback(() => {
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

			const blob = new Blob([workerCode], { type: "application/javascript" });
			const workerUrl = URL.createObjectURL(blob);
			const worker = new Worker(workerUrl);

			// Set timeout to terminate worker (1 second)
			const timeoutId = setTimeout(() => {
				worker.terminate();
				URL.revokeObjectURL(workerUrl);
				// toast.error("Error: Code execution timed out (max 1 second)");
				console.error("Error: Code execution timed out");
				posthog.capture("code_execution_timeout", {
					code,
					generationId,
				});
			}, 5000);

			// Listen for messages from worker
			worker.onmessage = (e) => {
				const data = e.data;

				if (data.action === "setBlock") {
					const { x, y, z, blockType } = data.params;
					handleSetBlock(x, y, z, blockType);
				} else if (data.action === "fill") {
					const { x1, y1, z1, x2, y2, z2, blockType } = data.params;
					handleFill(x1, y1, z1, x2, y2, z2, blockType);
				} else if (data.action === "complete") {
					clearTimeout(timeoutId);
					worker.terminate();
					URL.revokeObjectURL(workerUrl);
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
			toast.error(
				`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}, [clearBlocks, handleSetBlock, handleFill, code, generationId]);

	// Execute user code whenever code changes
	useEffect(() => {
		if (inited && code) {
			executeCode();
		}
	}, [inited, code, executeCode]);

	return (
		<div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-md overflow-hidden border border-gray-200 shadow-inner">
			<canvas ref={canvasRef} className="w-full h-full" />
		</div>
	);
};

export default SceneRenderer;
