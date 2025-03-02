import * as THREE from "three";

export type NormalMapPattern = "noise" | "grid" | "smooth" | "rough" | "bumpy";

export const blockTypes = [
	{
		name: "grass",
		color: 0x3bca2b,
		roughness: 0.9,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.8, 0.8),
		normalMapPattern: "bumpy" as NormalMapPattern,
		normalMapIntensity: 0.7,
	},
	{
		name: "stone",
		color: 0x969696,
		roughness: 0.9,
		metalness: 0.0,
		normalScale: new THREE.Vector2(1.0, 1.0),
		normalMapPattern: "rough" as NormalMapPattern,
		normalMapIntensity: 0.9,
	},
	{
		name: "dirt",
		color: 0x8b4513,
		roughness: 0.8,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.7, 0.7),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.8,
	},
	{
		name: "wood",
		color: 0x8b4513,
		roughness: 0.6,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.6, 0.6),
		normalMapPattern: "grid" as NormalMapPattern,
		normalMapIntensity: 0.6,
	},
	{
		name: "water",
		color: 0x1e90ff,
		roughness: 0.1,
		metalness: 0.2,
		normalScale: new THREE.Vector2(0.3, 0.3),
		transparent: true,
		opacity: 0.7,
		normalMapPattern: "smooth" as NormalMapPattern,
		normalMapIntensity: 0.3,
	},
	{
		name: "sand",
		color: 0xffef8f,
		roughness: 0.8,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
	{
		name: "sandstone",
		color: 0xd2b48c,
		roughness: 1.0,
		metalness: 0.2,
		normalScale: new THREE.Vector2(1.2, 1.2),
		normalMapPattern: "bumpy" as NormalMapPattern,
		normalMapIntensity: 0.8,
	},
	{
		name: "glass",
		color: 0xffffff,
		roughness: 0.1,
		metalness: 0.1,
		normalScale: new THREE.Vector2(0.2, 0.2),
		opacity: 0.2,
		normalMapPattern: "smooth" as NormalMapPattern,
		normalMapIntensity: 0.2,
	},
	{
		name: "gold",
		color: 0xffd700,
		roughness: 0.2,
		metalness: 0.8,
		normalScale: new THREE.Vector2(0.8, 0.8),
		clearcoat: 0.5,
		clearcoatRoughness: 0.1,
		normalMapPattern: "bumpy" as NormalMapPattern,
		normalMapIntensity: 0.8,
	},
	{
		name: "cobblestone",
		color: 0x555555,
		roughness: 1.0,
		metalness: 0.0,
		normalScale: new THREE.Vector2(1.2, 1.2),
		normalMapPattern: "rough" as NormalMapPattern,
		normalMapIntensity: 1.0,
	},
	{
		name: "brick",
		color: 0xb22222,
		roughness: 0.8,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.9, 0.9),
		normalMapPattern: "grid" as NormalMapPattern,
		normalMapIntensity: 0.8,
	},
	{
		name: "leaves",
		color: 0x2d8c24,
		roughness: 0.9,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.6, 0.6),
		normalMapPattern: "bumpy" as NormalMapPattern,
		normalMapIntensity: 0.6,
	},
	{
		name: "bedrock",
		color: 0x221f26,
		roughness: 0.9,
		metalness: 0.0,
		normalScale: new THREE.Vector2(1.5, 1.5),
		normalMapPattern: "rough" as NormalMapPattern,
		normalMapIntensity: 1.0,
	},
	{
		name: "lava",
		color: 0xff4500,
		roughness: 0.3,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.9, 0.9),
		emissive: 0xff4500,
		emissiveIntensity: 0.5,
		normalMapPattern: "smooth" as NormalMapPattern,
		normalMapIntensity: 0.9,
	},
	{
		name: "gravel",
		color: 0x777777,
		roughness: 0.9,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.8, 0.8),
		normalMapPattern: "rough" as NormalMapPattern,
		normalMapIntensity: 0.8,
	},
	{
		name: "iron",
		color: 0xcccccc,
		roughness: 0.3,
		metalness: 0.7,
		normalScale: new THREE.Vector2(0.7, 0.7),
		clearcoat: 0.5,
		clearcoatRoughness: 0.1,
		normalMapPattern: "bumpy" as NormalMapPattern,
		normalMapIntensity: 0.7,
	},
	{
		name: "diamond",
		color: 0x00ffff,
		roughness: 0.1,
		metalness: 0.9,
		normalScale: new THREE.Vector2(0.9, 0.9),
		clearcoat: 0.5,
		clearcoatRoughness: 0.1,
		normalMapPattern: "bumpy" as NormalMapPattern,
		normalMapIntensity: 0.9,
	},
	{
		name: "emerald",
		color: 0x50c878,
		roughness: 0.2,
		metalness: 0.8,
		normalScale: new THREE.Vector2(0.8, 0.8),
		clearcoat: 0.5,
		clearcoatRoughness: 0.1,
		normalMapPattern: "bumpy" as NormalMapPattern,
		normalMapIntensity: 0.8,
	},
	{
		name: "obsidian",
		color: 0x1a1a1a,
		roughness: 0.8,
		metalness: 0.3,
		normalScale: new THREE.Vector2(0.9, 0.9),
		normalMapPattern: "rough" as NormalMapPattern,
		normalMapIntensity: 0.9,
	},
	{
		name: "snow",
		color: 0xffffff,
		roughness: 0.9,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.4, 0.4),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.4,
	},
	{
		name: "ice",
		color: 0xadd8e6,
		roughness: 0.1,
		metalness: 0.1,
		normalScale: new THREE.Vector2(0.2, 0.2),
		transparent: true,
		opacity: 0.5,
		normalMapPattern: "smooth" as NormalMapPattern,
		normalMapIntensity: 0.2,
	},
	{
		name: "clay",
		color: 0xb2b2b2,
		roughness: 0.8,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.6, 0.6),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.6,
	},
	{
		name: "wool",
		color: 0xf5f5f5,
		roughness: 0.95,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
	{
		name: "red_wool",
		color: 0xff0000,
		roughness: 0.95,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
	{
		name: "blue_wool",
		color: 0x0000aa,
		roughness: 0.95,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
	{
		name: "green_wool",
		color: 0x00aa00,
		roughness: 0.95,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
	{
		name: "yellow_wool",
		color: 0xffff00,
		roughness: 0.95,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
	{
		name: "purple_wool",
		color: 0x800080,
		roughness: 0.95,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
	{
		name: "orange_wool",
		color: 0xffa500,
		roughness: 0.95,
		metalness: 0.0,
		normalScale: new THREE.Vector2(0.5, 0.5),
		normalMapPattern: "noise" as NormalMapPattern,
		normalMapIntensity: 0.5,
	},
];
