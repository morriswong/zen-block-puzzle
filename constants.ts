// Dimensions for 8-puzzle (3x3 grid)
export const IMAGE_SIZE = 600;
export const GRID_SIZE = 3;
export const TILE_SIZE = IMAGE_SIZE / GRID_SIZE; // 200px

// Image Source - Random image with cache-busting
export const getImageUrl = (): string => {
  return `https://picsum.photos/600?random=${Date.now()}`;
};

// For backward compatibility
export const IMAGE_URL = getImageUrl();

// Tile positions in solved state (0-8, where 8 is empty)
// Position index = row * 3 + col
export const SOLVED_STATE = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// Empty tile is represented by this value
export const EMPTY_TILE = 8;

// Food categories for photo guessing game
export const FOOD_CATEGORIES = [
  'burger',
  'pizza',
  'fried chicken',
  'tacos',
  'sushi',
  'pasta',
  'ramen',
  'ice cream',
  'donuts',
  'hot dog',
  'sandwich',
  'salad',
  'steak',
  'curry',
  'dim sum',
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number];
