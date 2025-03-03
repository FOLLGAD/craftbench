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

interface SceneRef {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	controls: OrbitControls;
	blocks: Map<string, THREE.Mesh>;
	geometries: THREE.Mesh[]; // Store all geometries
	blockPositions: Map<string, THREE.InstancedMesh>; // Track which positions belong to which instanced mesh
	THREE: typeof THREE;
	animationFrameId?: number; // Added to track animation frame
}

const SceneRenderer = ({ code, generationId }: SceneRendererProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<SceneRef | null>(null);
	const [inited, setInited] = useState(false);
	const userInteractedRef = useRef(false);
	const autoRotateAngle = useRef(0);

	useEffect(() => {
		// console.log(code);
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
		camera.position.set(25, 15, 25);
		camera.lookAt(0, -10, 0);

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
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
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
			geometries: [],
			blockPositions: new Map(), // Initialize the position tracking map
			THREE,
		};

		// Add event listeners to detect user interaction
		const handleUserInteraction = () => {
			userInteractedRef.current = true;
		};

		renderer.domElement.addEventListener("pointerdown", handleUserInteraction);
		renderer.domElement.addEventListener("wheel", handleUserInteraction);
		renderer.domElement.addEventListener("touchstart", handleUserInteraction);

		const animate = () => {
			const animationFrameId = requestAnimationFrame(animate);
			sceneRef.current.animationFrameId = animationFrameId;

			// Auto-rotate camera around the scene if user hasn't interacted
			if (!userInteractedRef.current) {
				// Increment the angle (0.005 radians per frame is a slow rotation)
				autoRotateAngle.current += 0.005;

				// Calculate new camera position in a circle around the center
				const radius = Math.sqrt(
					camera.position.x ** 2 + camera.position.z ** 2,
				);
				camera.position.x = radius * Math.sin(autoRotateAngle.current);
				camera.position.z = radius * Math.cos(autoRotateAngle.current);

				// Keep the camera looking at the center
				camera.lookAt(0, -10, 0);
			}

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
			renderer.domElement.removeEventListener(
				"pointerdown",
				handleUserInteraction,
			);
			renderer.domElement.removeEventListener("wheel", handleUserInteraction);
			renderer.domElement.removeEventListener(
				"touchstart",
				handleUserInteraction,
			);

			// Cancel any pending animation frame
			if (sceneRef.current?.animationFrameId) {
				cancelAnimationFrame(sceneRef.current.animationFrameId);
			}

			// Dispose of all geometries and materials to prevent memory leaks
			if (sceneRef.current) {
				const { scene, blocks, renderer, controls, geometries } =
					sceneRef.current;

				// Dispose of all blocks (meshes, geometries)
				for (const mesh of blocks.values()) {
					if (mesh.geometry) mesh.geometry.dispose();
					scene.remove(mesh);
				}

				// Dispose of all stored geometries
				for (const mesh of geometries) {
					if (mesh.geometry) mesh.geometry.dispose();
					scene.remove(mesh);
				}

				// Clear the blocks map and geometries array
				blocks.clear();
				geometries.length = 0;

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

	// Helper function to remove blocks at positions
	const removeBlocksAtPositions = useCallback((positions: string[]) => {
		if (!sceneRef.current) return;
		const { blockPositions, scene, geometries } = sceneRef.current;

		// Track which meshes need updating
		const meshesToUpdate = new Set<THREE.InstancedMesh>();

		for (const pos of positions) {
			const mesh = blockPositions.get(pos);
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
							const lastKey = getPositionKey(
								lastPosition.x,
								lastPosition.y,
								lastPosition.z,
							);
							blockPositions.set(lastKey, mesh);
						}

						// Reduce the instance count
						mesh.count--;
						meshesToUpdate.add(mesh);
						blockPositions.delete(pos);

						// If no instances left, remove the mesh entirely
						if (mesh.count === 0) {
							scene.remove(mesh);
							const index = geometries.indexOf(mesh);
							if (index > -1) {
								geometries.splice(index, 1);
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
	}, []);

	const handleSetBlock = useCallback(
		(x: number, y: number, z: number, blockType: string) => {
			if (!sceneRef.current) return;

			const posKey = getPositionKey(x, y, z);

			// Remove any existing blocks at this position
			removeBlocksAtPositions([posKey]);

			if (blockType.toLowerCase() === "air") {
				return;
			}

			const { scene, geometries, blockPositions } = sceneRef.current;
			const material = materialManager.getMaterial(blockType.toLowerCase());

			// Create a new instanced mesh with just one instance
			const geometry = new THREE.BoxGeometry(1, 1, 1);
			const instancedMesh = new THREE.InstancedMesh(geometry, material, 1);
			instancedMesh.castShadow = true;
			instancedMesh.receiveShadow = true;

			// Set the position
			const matrix = new THREE.Matrix4();
			matrix.setPosition(x, y, z);
			instancedMesh.setMatrixAt(0, matrix);
			instancedMesh.instanceMatrix.needsUpdate = true;

			// Add to scene and store references
			scene.add(instancedMesh);
			geometries.push(instancedMesh);
			blockPositions.set(posKey, instancedMesh);
		},
		[removeBlocksAtPositions],
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

			// Collect all positions in the fill region
			const positions: string[] = [];
			for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
				for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
					for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
						positions.push(getPositionKey(x, y, z));
					}
				}
			}

			// Remove existing blocks in the region
			removeBlocksAtPositions(positions);

			if (blockType.toLowerCase() === "air") {
				return;
			}

			const { scene, geometries, blockPositions } = sceneRef.current;

			// Get the material from the material manager
			const material = materialManager.getMaterial(blockType.toLowerCase());

			// Calculate dimensions
			const width = Math.abs(x2 - x1) + 1;
			const height = Math.abs(y2 - y1) + 1;
			const depth = Math.abs(z2 - z1) + 1;
			const totalInstances = width * height * depth;

			const geometry = new THREE.BoxGeometry(1, 1, 1);

			const instancedMesh = new THREE.InstancedMesh(
				geometry,
				material,
				totalInstances,
			);
			instancedMesh.castShadow = true;
			instancedMesh.receiveShadow = true;

			const matrix = new THREE.Matrix4();
			let instanceIndex = 0;

			for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
				for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
					for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
						matrix.setPosition(x, y, z);
						instancedMesh.setMatrixAt(instanceIndex, matrix);
						blockPositions.set(getPositionKey(x, y, z), instancedMesh);
						instanceIndex++;
					}
				}
			}

			instancedMesh.instanceMatrix.needsUpdate = true;

			scene.add(instancedMesh);
			geometries.push(instancedMesh);
		},
		[removeBlocksAtPositions],
	);

	const executeCode = useCallback(() => {
		if (!sceneRef.current) {
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

			const queue = [];

			// Listen for messages from worker
			worker.onmessage = (e) => {
				const data = e.data;

				const Y_OFFSET = 10; // ai likes placing things below origin

				if (data.action === "setBlock") {
					const { x, y, z, blockType } = data.params;
					queue.push(() => handleSetBlock(x, y + Y_OFFSET, z, blockType));
				} else if (data.action === "fill") {
					const { x1, y1, z1, x2, y2, z2, blockType } = data.params;
					queue.push(() =>
						handleFill(x1, y1 + Y_OFFSET, z1, x2, y2 + Y_OFFSET, z2, blockType),
					);
				} else if (data.action === "complete") {
					console.log("complete");
					clearTimeout(timeoutId);
					worker.terminate();
					URL.revokeObjectURL(workerUrl);
					for (const fn of queue) {
						fn();
					}
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
	}, [handleSetBlock, handleFill, code, generationId]);

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
