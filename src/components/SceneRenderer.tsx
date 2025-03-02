import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
// @ts-expect-error dasdas
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { materialManager } from "../utils/materials";

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
	geometries: THREE.Mesh[]; // Store all geometries
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
			geometries: [], // Initialize empty geometries array
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

	// Helper function to create a block mesh
	const createBlockMesh = useCallback(
		(x: number, y: number, z: number, blockType: string): THREE.Mesh => {
			// Handle fence blocks specially
			if (materialManager.isFenceType(blockType)) {
				return createFenceMesh(x, y, z, blockType);
			}
			
			const geometry = new THREE.BoxGeometry(1, 1, 1);
			const material = materialManager.getMaterial(blockType.toLowerCase());
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(x, y, z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			return mesh;
		},
		[],
	);
	
	// Helper function to create a fence mesh
	const createFenceMesh = useCallback((x: number, y: number, z: number, blockType: string): THREE.Mesh => {
		const material = materialManager.getMaterial(blockType.toLowerCase());
		const fenceProps = materialManager.getFenceProperties(blockType);
		
		if (!fenceProps) {
			// Fallback to regular block if fence properties not found
			const geometry = new THREE.BoxGeometry(1, 1, 1);
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(x, y, z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			return mesh;
		}
		
		// Create fence post (vertical center post)
		const postWidth = fenceProps.postWidth;
		const postGeometry = new THREE.BoxGeometry(postWidth, 1, postWidth);
		postGeometry.translate(0, 0, 0); // Center post in block
		
		// Create horizontal rails
		const railWidth = fenceProps.railWidth;
		const railGeometries = [];
		
		// First rail
		if (fenceProps.railHeight1 !== undefined) {
			const rail1Geometry = new THREE.BoxGeometry(1, railWidth, railWidth);
			rail1Geometry.translate(0, fenceProps.railHeight1 - 0.5, 0); // Position rail at specified height
			railGeometries.push(rail1Geometry);
		}
		
		// Second rail
		if (fenceProps.railHeight2 !== undefined) {
			const rail2Geometry = new THREE.BoxGeometry(1, railWidth, railWidth);
			rail2Geometry.translate(0, fenceProps.railHeight2 - 0.5, 0); // Position rail at specified height
			railGeometries.push(rail2Geometry);
		}
		
		// Third rail (optional)
		if (fenceProps.railHeight3 !== undefined) {
			const rail3Geometry = new THREE.BoxGeometry(1, railWidth, railWidth);
			rail3Geometry.translate(0, fenceProps.railHeight3 - 0.5, 0); // Position rail at specified height
			railGeometries.push(rail3Geometry);
		}
		
		// Create Z-axis rails
		const zRailGeometries = [];
		
		// First Z rail
		if (fenceProps.railHeight1 !== undefined) {
			const zRail1Geometry = new THREE.BoxGeometry(railWidth, railWidth, 1);
			zRail1Geometry.translate(0, fenceProps.railHeight1 - 0.5, 0); // Position rail at specified height
			zRailGeometries.push(zRail1Geometry);
		}
		
		// Second Z rail
		if (fenceProps.railHeight2 !== undefined) {
			const zRail2Geometry = new THREE.BoxGeometry(railWidth, railWidth, 1);
			zRail2Geometry.translate(0, fenceProps.railHeight2 - 0.5, 0); // Position rail at specified height
			zRailGeometries.push(zRail2Geometry);
		}
		
		// Third Z rail (optional)
		if (fenceProps.railHeight3 !== undefined) {
			const zRail3Geometry = new THREE.BoxGeometry(railWidth, railWidth, 1);
			zRail3Geometry.translate(0, fenceProps.railHeight3 - 0.5, 0); // Position rail at specified height
			zRailGeometries.push(zRail3Geometry);
		}
		
		// Combine all geometries
		const geometriesArray = [postGeometry, ...railGeometries, ...zRailGeometries];
		const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometriesArray);
		
		// Create the mesh
		const mesh = new THREE.Mesh(mergedGeometry, material);
		mesh.position.set(x, y, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		
		return mesh;
	}, []);

	// Helper function to subtract air blocks from existing geometries
	const subtractAirBlock = useCallback((x: number, y: number, z: number) => {
		if (!sceneRef.current) return;
		const { scene, geometries } = sceneRef.current;

		// Create air block for subtraction
		const airGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01); // Slightly larger to ensure complete subtraction
		const airMesh = new THREE.Mesh(airGeometry);
		airMesh.position.set(x, y, z);

		// Process each existing geometry and subtract the air block
		const updatedGeometries: THREE.Mesh[] = [];
		let subtractionsPerformed = 0;

		for (let i = 0; i < geometries.length; i++) {
			const existingMesh = geometries[i];

			// Check if the mesh has a valid geometry
			if (!existingMesh.geometry) {
				updatedGeometries.push(existingMesh);
				continue;
			}

			// Calculate bounding box for the existing mesh if not already calculated
			if (!existingMesh.geometry.boundingBox) {
				existingMesh.geometry.computeBoundingBox();
			}

			// Skip if the mesh is too far away (optimization)
			// Use bounding box intersection check for more accurate detection
			const meshBoundingBox = existingMesh.geometry.boundingBox;
			const airBoundingBox = new THREE.Box3().setFromObject(airMesh);

			if (meshBoundingBox && !meshBoundingBox.intersectsBox(airBoundingBox)) {
				updatedGeometries.push(existingMesh);
				continue;
			}

			try {
				// Clone the meshes to avoid modifying the originals during CSG operations
				const meshForCSG = existingMesh.clone();
				const airMeshForCSG = airMesh.clone();

				const csgResult = CSG.subtract(meshForCSG, airMeshForCSG);

				// If the result is valid, replace the old mesh with the new one
				if (csgResult?.geometry) {
					// Preserve the material from the original mesh
					csgResult.material = existingMesh.material;
					csgResult.castShadow = true;
					csgResult.receiveShadow = true;

					// Remove the old mesh from the scene
					scene.remove(existingMesh);

					// Add the new mesh to the scene and updated geometries
					scene.add(csgResult);
					updatedGeometries.push(csgResult);
					subtractionsPerformed++;
				} else {
					// If subtraction failed, keep the original
					console.warn("CSG subtraction returned null or invalid geometry");
					updatedGeometries.push(existingMesh);
				}
			} catch (error) {
				// If an error occurs during CSG, keep the original
				console.error("CSG subtraction error:", error);
				updatedGeometries.push(existingMesh);
			}
		}

		// Update the geometries array
		sceneRef.current.geometries = updatedGeometries;

		// Dispose of the temporary air mesh
		airGeometry.dispose();
	}, []);

	// Handler for setBlock commands from worker
	const handleSetBlock = useCallback(
		(x: number, y: number, z: number, blockType: string) => {
			if (!sceneRef.current) return;

			const { scene, geometries } = sceneRef.current;

			// Handle air blocks by subtracting from existing geometries
			if (blockType.toLowerCase() === "air") {
				subtractAirBlock(x, y, z);
				return;
			}

			// Create new block
			const mesh = createBlockMesh(x, y, z, blockType);

			// Add to scene and store in geometries array
			scene.add(mesh);
			geometries.push(mesh);
		},
		[createBlockMesh, subtractAirBlock],
	);

	// Helper function to subtract air region from existing geometries
	const subtractAirRegion = useCallback(
		(
			x1: number,
			y1: number,
			z1: number,
			x2: number,
			y2: number,
			z2: number,
		) => {
			if (!sceneRef.current) return;
			// Ensure x1,y1,z1 is the minimum corner and x2,y2,z2 is the maximum
			const minX = Math.min(x1, x2);
			const minY = Math.min(y1, y2);
			const minZ = Math.min(z1, z2);
			const maxX = Math.max(x1, x2);
			const maxY = Math.max(y1, y2);
			const maxZ = Math.max(z1, z2);

			// Create a single air box for the entire region
			const width = maxX - minX + 1.01;
			const height = maxY - minY + 1.01;
			const depth = maxZ - minZ + 1.01;

			const airGeometry = new THREE.BoxGeometry(width, height, depth);
			const airMesh = new THREE.Mesh(airGeometry);

			// Position the air box at the center of the region
			airMesh.position.set(
				minX + width / 2 - 0.5,
				minY + height / 2 - 0.5,
				minZ + depth / 2 - 0.5,
			);

			const { scene, geometries } = sceneRef.current;
			const updatedGeometries: THREE.Mesh[] = [];
			let subtractionsPerformed = 0;

			// Create a bounding box for the air region
			const airBoundingBox = new THREE.Box3().setFromObject(airMesh);

			// Process each existing geometry and subtract the air region
			for (let i = 0; i < geometries.length; i++) {
				const existingMesh = geometries[i];

				// Check if the mesh has a valid geometry
				if (!existingMesh.geometry) {
					updatedGeometries.push(existingMesh);
					continue;
				}

				// Calculate bounding box for the existing mesh if not already calculated
				if (!existingMesh.geometry.boundingBox) {
					existingMesh.geometry.computeBoundingBox();
				}

				// Skip if the mesh is too far away (optimization)
				// Use bounding box intersection check for more accurate detection
				const meshBoundingBox = existingMesh.geometry.boundingBox;

				if (meshBoundingBox && !meshBoundingBox.intersectsBox(airBoundingBox)) {
					updatedGeometries.push(existingMesh);
					continue;
				}

				try {
					// Clone the meshes to avoid modifying the originals during CSG operations
					const meshForCSG = existingMesh.clone();
					const airMeshForCSG = airMesh.clone();

					const csgResult = CSG.subtract(meshForCSG, airMeshForCSG);

					// If the result is valid, replace the old mesh with the new one
					if (csgResult?.geometry) {
						// Preserve the material from the original mesh
						csgResult.material = existingMesh.material;
						csgResult.castShadow = true;
						csgResult.receiveShadow = true;

						// Remove the old mesh from the scene
						scene.remove(existingMesh);

						// Add the new mesh to the scene and updated geometries
						scene.add(csgResult);
						updatedGeometries.push(csgResult);
						subtractionsPerformed++;
					} else {
						// If subtraction failed, keep the original
						console.warn(
							"CSG region subtraction returned null or invalid geometry",
						);
						updatedGeometries.push(existingMesh);
					}
				} catch (error) {
					// If an error occurs during CSG, keep the original
					console.error("CSG region subtraction error:", error);
					updatedGeometries.push(existingMesh);
				}
			}

			// Update the geometries array
			sceneRef.current.geometries = updatedGeometries;

			// Dispose of the temporary air mesh
			airGeometry.dispose();
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

			const { scene, geometries } = sceneRef.current;

			// Handle air blocks by subtracting from existing geometries
			if (blockType.toLowerCase() === "air") {
				subtractAirRegion(x1, y1, z1, x2, y2, z2);
				return;
			}

			// Get the material from the material manager
			const material = materialManager.getMaterial(blockType.toLowerCase());

			// Create a single geometry for all blocks in the fill region
			const geometriesArray: THREE.BoxGeometry[] = [];

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
						geometriesArray.push(geometry);
					}
				}
			}

			// Merge all geometries into one
			const mergedGeometry =
				BufferGeometryUtils.mergeGeometries(geometriesArray);

			// Create a single mesh for all blocks
			const mesh = new THREE.Mesh(mergedGeometry, material);
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			// Add to scene and store in geometries array
			scene.add(mesh);
			geometries.push(mesh);
		},
		[subtractAirRegion],
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

			// Listen for messages from worker
			worker.onmessage = (e) => {
				const data = e.data;

				const Y_OFFSET = 10; // ai likes placing things below origin

				if (data.action === "setBlock") {
					const { x, y, z, blockType } = data.params;
					handleSetBlock(x, y + Y_OFFSET, z, blockType);
				} else if (data.action === "fill") {
					const { x1, y1, z1, x2, y2, z2, blockType } = data.params;
					handleFill(x1, y1 + Y_OFFSET, z1, x2, y2 + Y_OFFSET, z2, blockType);
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
