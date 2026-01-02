import { PieceState, PieceDef, Point } from '../types';
import { BLOCK_SIZE } from '../constants';

const BATCH_SIZE = 5;
const MARGIN = 40; // Space between pieces
const SPAWN_RADIUS_BASE = 100;
const SPAWN_RADIUS_INCREMENT = 50;
const MAX_PLACEMENT_ATTEMPTS = 50;

interface OccupiedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Calculate occupied rectangles for existing pieces
 */
export const calculateOccupiedRects = (
  pieces: PieceState[],
  pieceDefinitions: PieceDef[]
): OccupiedRect[] => {
  return pieces.map(p => {
    const def = pieceDefinitions.find(d => d.id === p.id);
    return {
      x: p.currentPos.x,
      y: p.currentPos.y,
      w: (def?.width || 1) * BLOCK_SIZE,
      h: (def?.height || 1) * BLOCK_SIZE
    };
  });
};

/**
 * Find a suitable spawn position for a new piece
 */
export const findSpawnPosition = (
  pieceWidth: number,
  pieceHeight: number,
  centerX: number,
  centerY: number,
  occupiedRects: OccupiedRect[],
  batchIndex: number,
  angleOffset: number
): Point => {
  const w = pieceWidth;
  const h = pieceHeight;

  // Calculate starting radius based on existing pieces
  let radius = occupiedRects.length > 0
    ? Math.max(500, occupiedRects.length * SPAWN_RADIUS_INCREMENT)
    : SPAWN_RADIUS_BASE;

  let angle = angleOffset;

  // Try multiple attempts with increasing radius
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const testX = centerX + Math.cos(angle) * (radius + (attempt * 20));
    const testY = centerY + Math.sin(angle) * (radius + (attempt * 20));

    // Rotate angle slightly for next attempt
    angle += 0.5;

    const testRect = { x: testX, y: testY, w: w + MARGIN, h: h + MARGIN };

    const hasOverlap = occupiedRects.some(r => {
      return (
        testRect.x < r.x + r.w &&
        testRect.x + testRect.w > r.x &&
        testRect.y < r.y + r.h &&
        testRect.y + testRect.h > r.y
      );
    });

    if (!hasOverlap) {
      return { x: testX, y: testY };
    }
  }

  // Fallback: Place it far away
  return { x: centerX + 1000 + (batchIndex * 200), y: centerY };
};

/**
 * Calculate center point of existing pieces
 */
export const calculateCenter = (occupiedRects: OccupiedRect[]): Point => {
  if (occupiedRects.length === 0) {
    return { x: 0, y: 0 };
  }

  const bounds = occupiedRects.reduce((acc, r) => ({
    minX: Math.min(acc.minX, r.x),
    maxX: Math.max(acc.maxX, r.x + r.w),
    minY: Math.min(acc.minY, r.y),
    maxY: Math.max(acc.maxY, r.y + r.h),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
};

/**
 * Generate a new batch of pieces with calculated positions
 */
export const generateBatchPieces = (
  batchIndex: number,
  currentPieces: PieceState[],
  pieceDefinitions: PieceDef[]
): PieceState[] => {
  const startIdx = batchIndex * BATCH_SIZE;
  const endIdx = startIdx + BATCH_SIZE;

  // Get definitions for this batch
  const batchDefs = pieceDefinitions.slice(startIdx, endIdx);
  if (batchDefs.length === 0) return [];

  const newPieces: PieceState[] = [];
  const occupiedRects = calculateOccupiedRects(currentPieces, pieceDefinitions);
  const center = calculateCenter(occupiedRects);

  batchDefs.forEach((def, i) => {
    const w = def.width * BLOCK_SIZE;
    const h = def.height * BLOCK_SIZE;

    // Spread pieces around a circle
    const angleOffset = (Math.PI * 2 * (i / batchDefs.length)) + Math.random();

    const position = findSpawnPosition(
      w,
      h,
      center.x,
      center.y,
      occupiedRects,
      i,
      angleOffset
    );

    // Add this piece to occupied rects for next piece's calculation
    occupiedRects.push({ x: position.x, y: position.y, w, h });

    newPieces.push({
      id: def.id,
      currentPos: position,
      targetPos: { x: 0, y: 0 },
      isLocked: false,
      zIndex: 10 + def.id,
      groupId: def.id,
    });
  });

  return newPieces;
};

/**
 * Check if current batch is complete (all pieces merged into one group)
 */
export const checkBatchCompletion = (
  pieces: PieceState[],
  totalPieces: number
): { isComplete: boolean; isGameComplete: boolean } => {
  if (pieces.length === 0) {
    return { isComplete: false, isGameComplete: false };
  }

  const uniqueGroups = new Set(pieces.map(p => p.groupId));

  // Batch complete if all current pieces are in one group but not all pieces spawned
  const isComplete = uniqueGroups.size === 1 && pieces.length < totalPieces;

  // Game complete if all pieces are in one group and all pieces spawned
  const isGameComplete = uniqueGroups.size === 1 && pieces.length === totalPieces;

  return { isComplete, isGameComplete };
};
