import { useState, useCallback, useEffect, useMemo } from 'react';

// Block shape definitions - each shape is a 2D array where 1 = filled, 0 = empty
export interface BlockShape {
  id: string;
  pattern: number[][];
  color: string;
}

// Block shapes with weights (higher = more common)
interface WeightedShape {
  id: string;
  pattern: number[][];
  weight: number;
}

// All available block shapes with weights for balanced gameplay
const WEIGHTED_SHAPES: WeightedShape[] = [
  // Single blocks (very common) - guaranteed to always fit if there's any empty cell
  { id: 'single', pattern: [[1]], weight: 15 },

  // Line shapes (2) - common
  { id: 'h2', pattern: [[1, 1]], weight: 10 },
  { id: 'v2', pattern: [[1], [1]], weight: 10 },

  // Line shapes (3) - common
  { id: 'h3', pattern: [[1, 1, 1]], weight: 8 },
  { id: 'v3', pattern: [[1], [1], [1]], weight: 8 },

  // Line shapes (4) - less common
  { id: 'h4', pattern: [[1, 1, 1, 1]], weight: 4 },
  { id: 'v4', pattern: [[1], [1], [1], [1]], weight: 4 },

  // Line shapes (5) - rare
  { id: 'h5', pattern: [[1, 1, 1, 1, 1]], weight: 2 },
  { id: 'v5', pattern: [[1], [1], [1], [1], [1]], weight: 2 },

  // Square shapes
  { id: 'square2', pattern: [[1, 1], [1, 1]], weight: 6 },
  { id: 'square3', pattern: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 1 },

  // Small L shapes - common
  { id: 'smallL1', pattern: [[1, 0], [1, 1]], weight: 8 },
  { id: 'smallL2', pattern: [[0, 1], [1, 1]], weight: 8 },
  { id: 'smallL3', pattern: [[1, 1], [1, 0]], weight: 8 },
  { id: 'smallL4', pattern: [[1, 1], [0, 1]], weight: 8 },

  // L shapes - less common
  { id: 'L1', pattern: [[1, 0], [1, 0], [1, 1]], weight: 3 },
  { id: 'L2', pattern: [[0, 1], [0, 1], [1, 1]], weight: 3 },
  { id: 'L3', pattern: [[1, 1], [1, 0], [1, 0]], weight: 3 },
  { id: 'L4', pattern: [[1, 1], [0, 1], [0, 1]], weight: 3 },

  // T shapes - less common
  { id: 'T1', pattern: [[1, 1, 1], [0, 1, 0]], weight: 3 },
  { id: 'T2', pattern: [[0, 1, 0], [1, 1, 1]], weight: 3 },
  { id: 'T3', pattern: [[1, 0], [1, 1], [1, 0]], weight: 3 },
  { id: 'T4', pattern: [[0, 1], [1, 1], [0, 1]], weight: 3 },
];

// Build weighted selection array
const buildWeightedArray = (): Omit<BlockShape, 'color'>[] => {
  const result: Omit<BlockShape, 'color'>[] = [];
  for (const shape of WEIGHTED_SHAPES) {
    for (let i = 0; i < shape.weight; i++) {
      result.push({ id: shape.id, pattern: shape.pattern });
    }
  }
  return result;
};

const WEIGHTED_BLOCK_ARRAY = buildWeightedArray();

// Single block shape for fallback (always fits if there's any empty cell)
const SINGLE_BLOCK: Omit<BlockShape, 'color'> = { id: 'single', pattern: [[1]] };

// Colors for blocks
const BLOCK_COLORS = [
  '#FF6B6B', // coral red
  '#4ECDC4', // teal
  '#45B7D1', // sky blue
  '#96CEB4', // sage green
  '#FFEAA7', // soft yellow
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // gold
];

export const GRID_SIZE = 8;

// Grid cell state
export interface GridCell {
  filled: boolean;
  colorIndex: number;
}

export interface BlockBlastProgress {
  blocksUsed: number;
  isComplete: boolean;
}

interface UseBlockBlastProps {
  onComplete: (imageUrl: string) => void;
  imageUrl: string;
}

interface UseBlockBlastReturn {
  grid: GridCell[][];
  currentBlocks: (BlockShape | null)[];
  progress: BlockBlastProgress;
  placeBlock: (blockIndex: number, gridRow: number, gridCol: number) => boolean;
  canPlaceBlock: (block: BlockShape, gridRow: number, gridCol: number) => boolean;
  canPlaceAnyBlock: () => boolean;
  resetGame: () => void;
}

// Generate random color index
const getRandomColorIndex = (): number => {
  return Math.floor(Math.random() * BLOCK_COLORS.length);
};

// Check if a specific block can be placed anywhere on a grid (only checks empty cells)
const canPlaceBlockAnywhere = (
  block: { pattern: number[][] },
  grid: GridCell[][]
): boolean => {
  const pattern = block.pattern;
  const rows = pattern.length;
  const cols = pattern[0].length;

  for (let gridRow = 0; gridRow <= GRID_SIZE - rows; gridRow++) {
    for (let gridCol = 0; gridCol <= GRID_SIZE - cols; gridCol++) {
      let canPlace = true;

      outer: for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (pattern[r][c] === 1) {
            if (grid[gridRow + r][gridCol + c].filled) {
              canPlace = false;
              break outer;
            }
          }
        }
      }

      if (canPlace) return true;
    }
  }

  return false;
};

// Generate a random block that can fit on the grid
const generateFittingBlock = (grid: GridCell[][]): BlockShape => {
  const shuffled = [...WEIGHTED_BLOCK_ARRAY].sort(() => Math.random() - 0.5);

  for (const shape of shuffled) {
    if (canPlaceBlockAnywhere(shape, grid)) {
      return {
        ...shape,
        color: BLOCK_COLORS[getRandomColorIndex()],
      };
    }
  }

  // Fallback to single block
  return {
    ...SINGLE_BLOCK,
    color: BLOCK_COLORS[getRandomColorIndex()],
  };
};

// Generate 3 random blocks that can fit
const generateBlockSet = (grid: GridCell[][]): BlockShape[] => {
  return [
    generateFittingBlock(grid),
    generateFittingBlock(grid),
    generateFittingBlock(grid),
  ];
};

// Create empty grid
const createEmptyGrid = (): GridCell[][] => {
  return Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill(null).map(() => ({
      filled: false,
      colorIndex: -1,
    }))
  );
};

export const useBlockBlast = ({
  onComplete,
  imageUrl,
}: UseBlockBlastProps): UseBlockBlastReturn => {
  const [grid, setGrid] = useState<GridCell[][]>(() => createEmptyGrid());
  const [currentBlocks, setCurrentBlocks] = useState<(BlockShape | null)[]>(() =>
    generateBlockSet(createEmptyGrid())
  );
  const [blocksUsed, setBlocksUsed] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Check if the entire grid is empty (all cells cleared)
  const isGridEmpty = (g: GridCell[][]): boolean => {
    return g.every(row => row.every(cell => !cell.filled));
  };

  // Trigger completion when board is fully cleared (after placing at least one block)
  const triggerCompletion = useCallback(() => {
    if (!hasCompleted) {
      setHasCompleted(true);
      setTimeout(() => {
        onComplete(imageUrl);
      }, 1000);
    }
  }, [hasCompleted, onComplete, imageUrl]);

  // Check if a block can be placed at a position (only checks empty cells - NO revealed area restriction)
  const canPlaceBlock = useCallback((block: BlockShape, gridRow: number, gridCol: number): boolean => {
    const pattern = block.pattern;
    const rows = pattern.length;
    const cols = pattern[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (pattern[r][c] === 1) {
          const newRow = gridRow + r;
          const newCol = gridCol + c;

          // Out of bounds
          if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
            return false;
          }

          // Cell is filled
          if (grid[newRow][newCol].filled) {
            return false;
          }
        }
      }
    }

    return true;
  }, [grid]);

  // Check if any current block can be placed anywhere
  const canPlaceAnyBlock = useCallback((): boolean => {
    for (const block of currentBlocks) {
      if (!block) continue;
      if (canPlaceBlockAnywhere(block, grid)) {
        return true;
      }
    }
    return false;
  }, [currentBlocks, grid]);

  // Auto-regenerate blocks when stuck (ensures game is always completable)
  useEffect(() => {
    const hasBlocks = currentBlocks.some(b => b !== null);
    if (hasBlocks && !hasCompleted) {
      const canPlace = canPlaceAnyBlock();
      if (!canPlace) {
        setCurrentBlocks(generateBlockSet(grid));
      }
    }
  }, [grid, currentBlocks, hasCompleted, canPlaceAnyBlock]);

  // Place a block on the grid
  const placeBlock = useCallback((blockIndex: number, gridRow: number, gridCol: number): boolean => {
    const block = currentBlocks[blockIndex];
    if (!block) return false;

    if (!canPlaceBlock(block, gridRow, gridCol)) {
      return false;
    }

    const pattern = block.pattern;
    const colorIndex = BLOCK_COLORS.indexOf(block.color);

    // Place the block
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    for (let r = 0; r < pattern.length; r++) {
      for (let c = 0; c < pattern[0].length; c++) {
        if (pattern[r][c] === 1) {
          newGrid[gridRow + r][gridCol + c] = {
            filled: true,
            colorIndex,
          };
        }
      }
    }

    // Check for completed rows and columns
    const completedRows: number[] = [];
    const completedCols: number[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row].every(cell => cell.filled)) {
        completedRows.push(row);
      }
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      if (newGrid.every(row => row[col].filled)) {
        completedCols.push(col);
      }
    }

    const totalCleared = completedRows.length + completedCols.length;

    if (totalCleared > 0) {
      // Clear the completed lines
      completedRows.forEach(row => {
        for (let c = 0; c < GRID_SIZE; c++) {
          newGrid[row][c] = { filled: false, colorIndex: -1 };
        }
      });

      completedCols.forEach(col => {
        for (let r = 0; r < GRID_SIZE; r++) {
          newGrid[r][col] = { filled: false, colorIndex: -1 };
        }
      });
    }

    // Increment blocks used counter
    setBlocksUsed(prev => prev + 1);

    setGrid(newGrid);

    // Check if grid is completely empty after line clearing - game complete!
    if (totalCleared > 0 && isGridEmpty(newGrid)) {
      triggerCompletion();
    }

    // Remove used block
    const newBlocks = [...currentBlocks];
    newBlocks[blockIndex] = null;

    // If all blocks used, generate new set
    if (newBlocks.every(b => b === null)) {
      setCurrentBlocks(generateBlockSet(newGrid));
    } else {
      setCurrentBlocks(newBlocks);
    }

    return true;
  }, [grid, currentBlocks, canPlaceBlock, triggerCompletion]);

  // Reset game
  const resetGame = useCallback(() => {
    const emptyGrid = createEmptyGrid();
    setGrid(emptyGrid);
    setCurrentBlocks(generateBlockSet(emptyGrid));
    setBlocksUsed(0);
    setHasCompleted(false);
  }, []);

  const progress: BlockBlastProgress = useMemo(() => ({
    blocksUsed,
    isComplete: hasCompleted,
  }), [blocksUsed, hasCompleted]);

  return {
    grid,
    currentBlocks,
    progress,
    placeBlock,
    canPlaceBlock,
    canPlaceAnyBlock,
    resetGame,
  };
};

export { BLOCK_COLORS };
