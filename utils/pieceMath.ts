import { PieceState, Point, PieceDef } from '../types';
import { BLOCK_SIZE, SNAP_THRESHOLD } from '../constants';

/**
 * Check if two pieces should be neighbors based on their expected positions
 * Returns true if piece A is adjacent to piece B in the solution grid
 * and their relative position matches that relationship.
 */
export const areNeighbors = (
  p1: PieceState,
  p2: PieceState,
  pieceDefinitions: PieceDef[]
): boolean => {
  const def1 = pieceDefinitions.find(d => d.id === p1.id);
  const def2 = pieceDefinitions.find(d => d.id === p2.id);
  if (!def1 || !def2) return false;

  // Expected relative distance in grid units
  const gridDiffX = (def2.origin.x - def1.origin.x) * BLOCK_SIZE;
  const gridDiffY = (def2.origin.y - def1.origin.y) * BLOCK_SIZE;

  // Current relative distance
  const currentDiffX = p2.currentPos.x - p1.currentPos.x;
  const currentDiffY = p2.currentPos.y - p1.currentPos.y;

  // Check if they are close enough to the expected relative position
  const dist = Math.hypot(currentDiffX - gridDiffX, currentDiffY - gridDiffY);
  return dist < SNAP_THRESHOLD;
};

/**
 * Get expected position of p2 relative to p1 based on their solution positions
 */
export const getExpectedPosition = (
  p1: PieceState,
  p2Id: number,
  pieceDefinitions: PieceDef[]
): Point | null => {
  const def1 = pieceDefinitions.find(d => d.id === p1.id);
  const def2 = pieceDefinitions.find(d => d.id === p2Id);
  if (!def1 || !def2) return null;

  const diffX = (def2.origin.x - def1.origin.x) * BLOCK_SIZE;
  const diffY = (def2.origin.y - def1.origin.y) * BLOCK_SIZE;

  return {
    x: p1.currentPos.x + diffX,
    y: p1.currentPos.y + diffY
  };
};

/**
 * Calculate bounding box for a piece
 */
export const calculatePieceBounds = (
  piece: PieceState,
  definition: PieceDef
): { x: number; y: number; w: number; h: number } => {
  return {
    x: piece.currentPos.x,
    y: piece.currentPos.y,
    w: definition.width * BLOCK_SIZE,
    h: definition.height * BLOCK_SIZE
  };
};

/**
 * Transform world coordinates to screen coordinates
 */
export const worldToScreen = (
  worldPos: Point,
  pan: Point,
  zoom: number
): Point => {
  return {
    x: worldPos.x * zoom + pan.x,
    y: worldPos.y * zoom + pan.y
  };
};

/**
 * Transform screen coordinates to world coordinates
 */
export const screenToWorld = (
  screenPos: Point,
  pan: Point,
  zoom: number
): Point => {
  return {
    x: (screenPos.x - pan.x) / zoom,
    y: (screenPos.y - pan.y) / zoom
  };
};
