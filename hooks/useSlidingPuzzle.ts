import { useState, useCallback, useEffect } from 'react';
import { BoardState, GameProgress } from '../types';
import { GRID_SIZE, EMPTY_TILE, SOLVED_STATE } from '../constants';

interface UseSlidingPuzzleProps {
  onComplete: (imageUrl: string) => void;
  imageUrl: string;
}

interface UseSlidingPuzzleReturn {
  board: BoardState;
  progress: GameProgress;
  moveTile: (position: number) => void;
  shuffle: () => void;
}

// Check if the puzzle is solved
const isSolved = (board: BoardState): boolean => {
  return board.every((tile, index) => tile === SOLVED_STATE[index]);
};

// Get the position of the empty tile
const getEmptyPosition = (board: BoardState): number => {
  return board.indexOf(EMPTY_TILE);
};

// Get row and column from position index
const getRowCol = (position: number): { row: number; col: number } => ({
  row: Math.floor(position / GRID_SIZE),
  col: position % GRID_SIZE,
});

// Check if a position is adjacent to the empty tile
const isAdjacentToEmpty = (board: BoardState, position: number): boolean => {
  const emptyPos = getEmptyPosition(board);
  const { row: emptyRow, col: emptyCol } = getRowCol(emptyPos);
  const { row: tileRow, col: tileCol } = getRowCol(position);

  // Adjacent means exactly 1 step away horizontally or vertically
  const rowDiff = Math.abs(emptyRow - tileRow);
  const colDiff = Math.abs(emptyCol - tileCol);

  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

// Count inversions in the puzzle (for solvability check)
const countInversions = (board: BoardState): number => {
  let inversions = 0;
  const tiles = board.filter(t => t !== EMPTY_TILE);

  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) {
        inversions++;
      }
    }
  }
  return inversions;
};

// Check if a puzzle configuration is solvable
// For a 3x3 puzzle, solvable if number of inversions is even
const isSolvable = (board: BoardState): boolean => {
  return countInversions(board) % 2 === 0;
};

// Generate a shuffled, solvable puzzle
const generateShuffledBoard = (): BoardState => {
  let board: BoardState;

  do {
    // Fisher-Yates shuffle
    board = [...SOLVED_STATE];
    for (let i = board.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [board[i], board[j]] = [board[j], board[i]];
    }
  } while (!isSolvable(board) || isSolved(board));

  return board;
};

export const useSlidingPuzzle = ({
  onComplete,
  imageUrl,
}: UseSlidingPuzzleProps): UseSlidingPuzzleReturn => {
  const [board, setBoard] = useState<BoardState>(() => generateShuffledBoard());
  const [moves, setMoves] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Check for completion
  useEffect(() => {
    if (isSolved(board) && moves > 0 && !hasCompleted) {
      setHasCompleted(true);
      // Small delay before showing completion
      setTimeout(() => {
        onComplete(imageUrl);
      }, 500);
    }
  }, [board, moves, hasCompleted, onComplete, imageUrl]);

  const moveTile = useCallback((position: number) => {
    if (board[position] === EMPTY_TILE) return;
    if (!isAdjacentToEmpty(board, position)) return;

    setBoard(prev => {
      const newBoard = [...prev];
      const emptyPos = getEmptyPosition(newBoard);
      // Swap the tile with the empty space
      [newBoard[position], newBoard[emptyPos]] = [newBoard[emptyPos], newBoard[position]];
      return newBoard;
    });
    setMoves(m => m + 1);
  }, [board]);

  const shuffle = useCallback(() => {
    setBoard(generateShuffledBoard());
    setMoves(0);
    setHasCompleted(false);
  }, []);

  const progress: GameProgress = {
    moves,
    isSolved: isSolved(board),
  };

  return {
    board,
    progress,
    moveTile,
    shuffle,
  };
};
