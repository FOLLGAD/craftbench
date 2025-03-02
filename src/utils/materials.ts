import * as THREE from "three";
import { blockTypes } from "./blockTypes";
import type { NormalMapPattern } from "./blockTypes";

export class MaterialManager {
	private static instance: MaterialManager;
	private materials: Map<string, THREE.Material>;
	private normalMaps: Map<string, THREE.CanvasTexture>;
	private initialized = false;

	private constructor() {
		this.materials = new Map();
		this.normalMaps = new Map();
	}

	public static getInstance(): MaterialManager {
		if (!MaterialManager.instance) {
			MaterialManager.instance = new MaterialManager();
		}
		return MaterialManager.instance;
	}

	public getMaterial(blockType: string): THREE.Material {
		return (
			this.materials.get(blockType.toLowerCase()) ||
			this.materials.get("default")
		);
	}

	// Method to check if a block type is a fence
	public isFenceType(blockType: string): boolean {
		const blockInfo = blockTypes.find(block => block.name === blockType.toLowerCase());
		return blockInfo ? !!blockInfo.isFence : false;
	}

	// Method to get fence properties for a block type
	public getFenceProperties(blockType: string): any {
		const blockInfo = blockTypes.find(block => block.name === blockType.toLowerCase());
		if (!blockInfo || !blockInfo.isFence) return null;
		
		return {
			postWidth: blockInfo.postWidth || 0.25,
			railHeight1: blockInfo.railHeight1 || 0.3,
			railHeight2: blockInfo.railHeight2 || 0.7,
			railHeight3: blockInfo.railHeight3,
			railWidth: blockInfo.railWidth || 0.15,
		};
	}

	public initialize(): void {
		if (this.initialized) return;

		// Generate normal maps
		this.generateNormalMaps();

		// Create materials
		this.createMaterials();

		this.initialized = true;
	}

	public dispose(): void {
		// Dispose of materials
		for (const material of this.materials.values()) {
			if (Array.isArray(material)) {
				for (const mat of material) {
					mat.dispose();
				}
			} else {
				material.dispose();
			}
		}
		this.materials.clear();

		// Dispose of normal maps
		for (const normalMap of this.normalMaps.values()) {
			if (normalMap) normalMap.dispose();
		}
		this.normalMaps.clear();

		this.initialized = false;
	}

	private generateNormalMaps(): void {
		// Generate normal maps for each block type
		for (const blockType of blockTypes) {
			this.normalMaps.set(
				blockType.name,
				this.generateNormalMap(
					blockType.color,
					blockType.normalMapPattern,
					blockType.normalMapIntensity,
				),
			);
		}
	}

	private createMaterials(): void {
		// Create materials for each block type
		for (const blockType of blockTypes) {
			const normalMap =
				this.normalMaps.get(blockType.name) || this.normalMaps.get("stone");

			if (
				blockType.name === "glass" ||
				blockType.name === "water" ||
				blockType.name === "ice"
			) {
				this.materials.set(
					blockType.name,
					new THREE.MeshPhysicalMaterial({
						color: blockType.color,
						transparent: true,
						opacity: blockType.opacity,
						roughness: blockType.roughness,
						metalness: blockType.metalness,
						normalMap: normalMap,
						normalScale: blockType.normalScale,
						clearcoat: 0.3,
						clearcoatRoughness: 0.2,
					}),
				);
			} else if (blockType.name === "lava") {
				this.materials.set(
					blockType.name,
					new THREE.MeshStandardMaterial({
						color: blockType.color,
						roughness: blockType.roughness,
						metalness: blockType.metalness,
						normalMap: normalMap,
						normalScale: blockType.normalScale,
						emissive: blockType.emissive,
						emissiveIntensity: blockType.emissiveIntensity,
					}),
				);
			} else if (
				["diamond", "emerald", "gold", "iron"].includes(blockType.name)
			) {
				this.materials.set(
					blockType.name,
					new THREE.MeshPhysicalMaterial({
						color: blockType.color,
						roughness: blockType.roughness,
						metalness: blockType.metalness,
						normalMap: normalMap,
						normalScale: blockType.normalScale,
						clearcoat: blockType.clearcoat,
						clearcoatRoughness: blockType.clearcoatRoughness,
						reflectivity: 1.0,
					}),
				);
			} else {
				this.materials.set(
					blockType.name,
					new THREE.MeshStandardMaterial({
						color: blockType.color,
						roughness: blockType.roughness,
						metalness: blockType.metalness,
						normalMap: normalMap,
						normalScale: blockType.normalScale,
					}),
				);
			}
		}

		// Add a default material for unknown block types
		this.materials.set(
			"default",
			new THREE.MeshStandardMaterial({
				color: 0xff00ff, // Magenta for unknown blocks
				roughness: 0.7,
				metalness: 0.0,
			}),
		);
	}

	// Function to generate normal maps with different characteristics
	private generateNormalMap(
		color: number,
		pattern: NormalMapPattern = "noise",
		intensity = 0.5,
	): THREE.CanvasTexture | null {
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;

		// Fill with base color
		ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
		ctx.fillRect(0, 0, 256, 256);

		// Add pattern based on type
		switch (pattern) {
			case "grid": {
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

				// Create embossed effect by manipulating neighboring pixels
				const tempCanvas = document.createElement("canvas");
				tempCanvas.width = 256;
				tempCanvas.height = 256;
				const tempCtx = tempCanvas.getContext("2d");
				if (tempCtx) {
					tempCtx.putImageData(imageData, 0, 0);

					// Apply emboss-like filter
					ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
					ctx.fillRect(0, 0, 256, 256);

					ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
					ctx.shadowBlur = 2;
					ctx.shadowOffsetX = 2;
					ctx.shadowOffsetY = 2;
					ctx.drawImage(tempCanvas, 0, 0);

					ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
					ctx.shadowOffsetX = -2;
					ctx.shadowOffsetY = -2;
					ctx.drawImage(tempCanvas, 0, 0);
				}
				break;
			}

			case "rough":
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

			case "bumpy":
				// Create bumpy texture with circles
				for (let i = 0; i < 100; i++) {
					const x = Math.random() * 256;
					const y = Math.random() * 256;
					const radius = 5 + Math.random() * 15;
					const brightness = 50 + Math.random() * 150;

					const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
					gradient.addColorStop(
						0,
						`rgba(${brightness}, ${brightness}, ${brightness}, ${intensity})`,
					);
					gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

					ctx.fillStyle = gradient;
					ctx.beginPath();
					ctx.arc(x, y, radius, 0, Math.PI * 2);
					ctx.fill();
				}
				break;

			case "smooth":
				// Create smooth gradients
				for (let i = 0; i < 10; i++) {
					const x1 = Math.random() * 256;
					const y1 = Math.random() * 256;
					const x2 = Math.random() * 256;
					const y2 = Math.random() * 256;
					const r = 50 + Math.random() * 206;

					const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
					gradient.addColorStop(0, `rgba(${r}, ${r}, ${r}, 0)`);
					gradient.addColorStop(
						0.5,
						`rgba(${r}, ${r}, ${r}, ${intensity * 0.5})`,
					);
					gradient.addColorStop(1, `rgba(${r}, ${r}, ${r}, 0)`);

					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, 256, 256);
				}
				break;

			case "noise": {
				// Add randomized noise for normal map
				const pixels = ctx.getImageData(0, 0, 256, 256);
				const pixelData = pixels.data;

				for (let i = 0; i < pixelData.length; i += 4) {
					const noise = Math.random() * intensity * 100;
					pixelData[i] = Math.min(255, pixelData[i] + noise); // r
					pixelData[i + 1] = Math.min(255, pixelData[i + 1] + noise); // g
					pixelData[i + 2] = Math.min(255, pixelData[i + 2] + noise); // b
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
		}

		return new THREE.CanvasTexture(canvas);
	}
}

// Export a singleton instance
export const materialManager = MaterialManager.getInstance();
