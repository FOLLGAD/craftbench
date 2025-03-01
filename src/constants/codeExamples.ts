
export const DEFAULT_CODE_PROMPT = "// Try this example:\n// fill(0, 0, 0, 5, 5, 5, 'grass');\n// setBlock(0, 6, 0, 'stone');";

export const HOUSE_EXAMPLE = `// Create a small house

// Foundation
fill(0, 0, 0, 6, 0, 6, 'stone');

// Walls
fill(0, 1, 0, 6, 3, 0, 'wood'); // Front wall
fill(0, 1, 6, 6, 3, 6, 'wood'); // Back wall
fill(0, 1, 0, 0, 3, 6, 'wood'); // Left wall
fill(6, 1, 0, 6, 3, 6, 'wood'); // Right wall

// Door
fill(3, 1, 0, 3, 2, 0, 'glass');

// Windows
setBlock(1, 2, 0, 'glass');
setBlock(5, 2, 0, 'glass');

// Roof
for (let i = 0; i <= 6; i++) {
  fill(0, 4, i, 6, 4, i, 'stone');
}`;

export const PYRAMID_EXAMPLE = `// Create a pyramid
const size = 10;

for (let y = 0; y < size; y++) {
  const width = size - y;
  fill(-width, y, -width, width, y, width, 'sand');
}`;

export const CASTLE_EXAMPLE = `// Create a castle with new block types

// Main structure base
fill(-5, 0, -5, 5, 0, 5, 'cobblestone');

// Castle floor
fill(-4, 1, -4, 4, 1, 4, 'stone');

// Castle walls
fill(-4, 2, -4, 4, 5, -4, 'brick'); // Front wall
fill(-4, 2, 4, 4, 5, 4, 'brick');  // Back wall
fill(-4, 2, -4, -4, 5, 4, 'brick'); // Left wall
fill(4, 2, -4, 4, 5, 4, 'brick');  // Right wall

// Castle towers
fill(-4, 2, -4, -2, 7, -2, 'cobblestone'); // Left front tower
fill(2, 2, -4, 4, 7, -2, 'cobblestone');  // Right front tower
fill(-4, 2, 2, -2, 7, 4, 'cobblestone');  // Left back tower
fill(2, 2, 2, 4, 7, 4, 'cobblestone');   // Right back tower

// Castle entrance
fill(-1, 2, -4, 1, 4, -4, 'air'); // Door opening

// Tower top decorations
setBlock(-3, 8, -3, 'gold');
setBlock(3, 8, -3, 'gold');
setBlock(-3, 8, 3, 'gold');
setBlock(3, 8, 3, 'gold');

// Add some trees
// Tree 1
setBlock(-8, 1, -8, 'wood');
setBlock(-8, 2, -8, 'wood');
setBlock(-8, 3, -8, 'wood');
fill(-10, 3, -10, -6, 5, -6, 'leaves');

// Tree 2
setBlock(8, 1, 8, 'wood');
setBlock(8, 2, 8, 'wood');
setBlock(8, 3, 8, 'wood');
fill(6, 3, 6, 10, 5, 10, 'leaves');

// Add water moat
fill(-6, 1, -3, -6, 1, 3, 'water');
fill(6, 1, -3, 6, 1, 3, 'water');
fill(-6, 1, -3, 6, 1, -3, 'water');
fill(-6, 1, 3, 6, 1, 3, 'water');

// Add some bedrock as an unmovable foundation
fill(-5, -1, -5, 5, -1, 5, 'bedrock');`;

