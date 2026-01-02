import { PieceDef } from './types';

// Dimensions
export const IMAGE_SIZE = 800;
export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const BLOCK_SIZE = IMAGE_SIZE / GRID_COLS; // 100px
export const SNAP_THRESHOLD = 50;

// Image Source - Random image with cache-busting
export const getImageUrl = (): string => {
  // Add cache-busting parameter to ensure new image loads
  return `https://picsum.photos/800?random=${Date.now()}`;
};

// For backward compatibility, export a function that generates URL
export const IMAGE_URL = getImageUrl();

// Hardcoded Shapes
// The grid is 8x8 (64 blocks). We partition it into 32 pieces.

// 16 Pieces tiling the 8x8 grid using Tetris-like shapes (L, J, I)
// Tiling Strategy: The 8x8 grid is divided into 8 regions of 4x2 blocks.
// Each region contains 2 tetrominoes.
export const PIECE_DEFINITIONS: PieceDef[] = [
  // Row Pair 1 (Y: 0-1)
  // Box 1 (0,0): O + O (Squares)
  { id: 1, origin: { x: 0, y: 0 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], width: 2, height: 2 },
  { id: 2, origin: { x: 2, y: 0 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], width: 2, height: 2 },

  // Box 2 (4,0): J + L (Top-heavy)
  { id: 3, origin: { x: 4, y: 0 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }], width: 3, height: 2 },
  { id: 4, origin: { x: 5, y: 0 }, blocks: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], width: 3, height: 2 },

  // Row Pair 2 (Y: 2-3)
  // Box 3 (0,2): I + I (Horizontal)
  { id: 5, origin: { x: 0, y: 2 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], width: 4, height: 1 },
  { id: 6, origin: { x: 0, y: 3 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], width: 4, height: 1 },

  // Box 4 (4,2): L + J (Bottom-heavy)
  { id: 7, origin: { x: 4, y: 2 }, blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], width: 3, height: 2 },
  { id: 8, origin: { x: 5, y: 2 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], width: 3, height: 2 },

  // Row Pair 3 (Y: 4-5)
  // Box 5 (0,4): J + L (Top-heavy)
  { id: 9, origin: { x: 0, y: 4 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }], width: 3, height: 2 },
  { id: 10, origin: { x: 1, y: 4 }, blocks: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], width: 3, height: 2 },

  // Box 6 (4,4): I + I (Horizontal)
  { id: 11, origin: { x: 4, y: 4 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], width: 4, height: 1 },
  { id: 12, origin: { x: 4, y: 5 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], width: 4, height: 1 },

  // Row Pair 4 (Y: 6-7)
  // Box 7 (0,6): L + J (Bottom-heavy)
  { id: 13, origin: { x: 0, y: 6 }, blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], width: 3, height: 2 },
  { id: 14, origin: { x: 1, y: 6 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], width: 3, height: 2 },

  // Box 8 (4,6): O + O (Squares)
  { id: 15, origin: { x: 4, y: 6 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], width: 2, height: 2 },
  { id: 16, origin: { x: 6, y: 6 }, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], width: 2, height: 2 },
];
