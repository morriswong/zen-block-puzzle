import { useState, useCallback, useEffect, useMemo } from 'react';

// Block shape definitions - each shape is a 2D array where 1 = filled, 0 = empty
export interface BlockShape {
  id: string;
  pattern: number[][];
  color: string;
}

// All available block shapes
export const BLOCK_SHAPES: Omit<BlockShape, 'color'>[] = [
  // Single blocks
  { id: 'single', pattern: [[1]] },

  // Line shapes (2)
  { id: 'h2', pattern: [[1, 1]] },
  { id: 'v2', pattern: [[1], [1]] },

  // Line shapes (3)
  { id: 'h3', pattern: [[1, 1, 1]] },
  { id: 'v3', pattern: [[1], [1], [1]] },

  // Line shapes (4)
  { id: 'h4', pattern: [[1, 1, 1, 1]] },
  { id: 'v4', pattern: [[1], [1], [1], [1]] },

  // Line shapes (5)
  { id: 'h5', pattern: [[1, 1, 1, 1, 1]] },
  { id: 'v5', pattern: [[1], [1], [1], [1], [1]] },

  // Square shapes
  { id: 'square2', pattern: [[1, 1], [1, 1]] },
  { id: 'square3', pattern: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },

  // L shapes
  { id: 'L1', pattern: [[1, 0], [1, 0], [1, 1]] },
  { id: 'L2', pattern: [[0, 1], [0, 1], [1, 1]] },
  { id: 'L3', pattern: [[1, 1], [1, 0], [1, 0]] },
  { id: 'L4', pattern: [[1, 1], [0, 1], [0, 1]] },

  // Small L shapes
  { id: 'smallL1', pattern: [[1, 0], [1, 1]] },
  { id: 'smallL2', pattern: [[0, 1], [1, 1]] },
  { id: 'smallL3', pattern: [[1, 1], [1, 0]] },
  { id: 'smallL4', pattern: [[1, 1], [0, 1]] },

  // T shapes
  { id: 'T1', pattern: [[1, 1, 1], [0, 1, 0]] },
  { id: 'T2', pattern: [[0, 1, 0], [1, 1, 1]] },
  { id: 'T3', pattern: [[1, 0], [1, 1], [1, 0]] },
  { id: 'T4', pattern: [[0, 1], [1, 1], [0, 1]] },
];

// Colors for blocks (extracted from typical photo palettes)
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
  revealed: boolean; // For photo reveal mode
}

export interface BlockBlastProgress {
  score: number;
  linesCleared: number;
  totalLinesToClear: number; // 8 rows + 8 columns = 16 for full reveal
  isComplete: boolean;
}

interface UseBlockBlastProps {
  onComplete: (imageUrl: string) => void;
  imageUrl: string;
}

interface UseBlockBlastReturn {
  grid: GridCell[][];
  currentBlocks: BlockShape[];
  progress: BlockBlastProgress;
  revealedRows: Set<number>;
  revealedCols: Set<number>;
  placeBlock: (blockIndex: number, gridRow: number, gridCol: number) => boolean;
  canPlaceBlock: (block: BlockShape, gridRow: number, gridCol: number) => boolean;
  canPlaceAnyBlock: () => boolean;
  resetGame: () => void;
}

// Generate random color index
const getRandomColorIndex = (): number => {
  return Math.floor(Math.random() * BLOCK_COLORS.length);
};

// Generate a random block with color
const generateRandomBlock = (): BlockShape => {
  const shape = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
  return {
    ...shape,
    color: BLOCK_COLORS[getRandomColorIndex()],
  };
};

// Generate 3 random blocks
const generateBlockSet = (): BlockShape[] => {
  return [generateRandomBlock(), generateRandomBlock(), generateRandomBlock()];
};

// Create empty grid
const createEmptyGrid = (): GridCell[][] => {
  return Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill(null).map(() => ({
      filled: false,
      colorIndex: -1,
      revealed: false,
    }))
  );
};

export const useBlockBlast = ({
  onComplete,
  imageUrl,
}: UseBlockBlastProps): UseBlockBlastReturn => {
  const [grid, setGrid] = useState<GridCell[][]>(() => createEmptyGrid());
  const [currentBlocks, setCurrentBlocks] = useState<BlockShape[]>(() => generateBlockSet());
  const [score, setScore] = useState(0);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());
  const [revealedCols, setRevealedCols] = useState<Set<number>>(new Set());
  const [hasCompleted, setHasCompleted] = useState(false);

  // Check if all rows and columns are revealed
  const isComplete = revealedRows.size === GRID_SIZE && revealedCols.size === GRID_SIZE;

  // Trigger completion
  useEffect(() => {
    if (isComplete && !hasCompleted) {
      setHasCompleted(true);
      setTimeout(() => {
        onComplete(imageUrl);
      }, 1000);
    }
  }, [isComplete, hasCompleted, onComplete, imageUrl]);

  // Check if a block can be placed at a position
  const canPlaceBlock = useCallback((block: BlockShape, gridRow: number, gridCol: number): boolean => {
    const pattern = block.pattern;
    const rows = pattern.length;
    const cols = pattern[0].length;

    // Check bounds and overlap
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (pattern[r][c] === 1) {
          const newRow = gridRow + r;
          const newCol = gridCol + c;

          // Out of bounds
          if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
            return false;
          }

          // Already filled
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
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (canPlaceBlock(block, row, col)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [currentBlocks, canPlaceBlock]);

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
            revealed: false,
          };
        }
      }
    }

    // Check for completed rows and columns
    const rowsToCheck = new Set<number>();
    const colsToCheck = new Set<number>();

    for (let r = 0; r < pattern.length; r++) {
      for (let c = 0; c < pattern[0].length; c++) {
        if (pattern[r][c] === 1) {
          rowsToCheck.add(gridRow + r);
          colsToCheck.add(gridCol + c);
        }
      }
    }

    // Find completed rows
    const completedRows: number[] = [];
    rowsToCheck.forEach(row => {
      if (newGrid[row].every(cell => cell.filled)) {
        completedRows.push(row);
      }
    });

    // Find completed columns
    const completedCols: number[] = [];
    colsToCheck.forEach(col => {
      if (newGrid.every(row => row[col].filled)) {
        completedCols.push(col);
      }
    });

    // Clear completed rows and columns
    const totalCleared = completedRows.length + completedCols.length;

    if (totalCleared > 0) {
      // Mark cells to clear
      completedRows.forEach(row => {
        for (let c = 0; c < GRID_SIZE; c++) {
          newGrid[row][c] = { filled: false, colorIndex: -1, revealed: false };
        }
      });

      completedCols.forEach(col => {
        for (let r = 0; r < GRID_SIZE; r++) {
          newGrid[r][col] = { filled: false, colorIndex: -1, revealed: false };
        }
      });

      // Update revealed rows/cols
      setRevealedRows(prev => {
        const next = new Set(prev);
        completedRows.forEach(r => next.add(r));
        return next;
      });

      setRevealedCols(prev => {
        const next = new Set(prev);
        completedCols.forEach(c => next.add(c));
        return next;
      });

      // Calculate score (bonus for multiple clears)
      const baseScore = totalCleared * 10;
      const bonus = totalCleared > 1 ? totalCleared * 5 : 0;
      setScore(prev => prev + baseScore + bonus);
    }

    setGrid(newGrid);

    // Remove used block and check if we need new blocks
    const newBlocks = [...currentBlocks];
    newBlocks[blockIndex] = null as any;

    // If all blocks used, generate new set
    if (newBlocks.every(b => b === null)) {
      setCurrentBlocks(generateBlockSet());
    } else {
      setCurrentBlocks(newBlocks);
    }

    return true;
  }, [grid, currentBlocks, canPlaceBlock]);

  // Reset game
  const resetGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setCurrentBlocks(generateBlockSet());
    setScore(0);
    setRevealedRows(new Set());
    setRevealedCols(new Set());
    setHasCompleted(false);
  }, []);

  const progress: BlockBlastProgress = useMemo(() => ({
    score,
    linesCleared: revealedRows.size + revealedCols.size,
    totalLinesToClear: GRID_SIZE * 2, // 8 rows + 8 columns
    isComplete,
  }), [score, revealedRows.size, revealedCols.size, isComplete]);

  return {
    grid,
    currentBlocks,
    progress,
    revealedRows,
    revealedCols,
    placeBlock,
    canPlaceBlock,
    canPlaceAnyBlock,
    resetGame,
  };
};

export { BLOCK_COLORS };
