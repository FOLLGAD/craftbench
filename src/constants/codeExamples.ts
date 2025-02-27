
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
