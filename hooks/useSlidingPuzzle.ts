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

// Get positions adjacent to the empty tile
const getAdjacentPositions = (emptyPos: number): number[] => {
  const { row, col } = getRowCol(emptyPos);
  const adjacent: number[] = [];

  if (row > 0) adjacent.push((row - 1) * GRID_SIZE + col); // up
  if (row < GRID_SIZE - 1) adjacent.push((row + 1) * GRID_SIZE + col); // down
  if (col > 0) adjacent.push(row * GRID_SIZE + (col - 1)); // left
  if (col < GRID_SIZE - 1) adjacent.push(row * GRID_SIZE + (col + 1)); // right

  return adjacent;
};

// Generate an easy puzzle by making a limited number of random moves
// This guarantees solvability and controls difficulty
const SHUFFLE_MOVES = 15; // Number of random moves - easy difficulty

const generateShuffledBoard = (): BoardState => {
  const board = [...SOLVED_STATE];
  let lastMove = -1; // Track last move to avoid immediate undo

  for (let i = 0; i < SHUFFLE_MOVES; i++) {
    const emptyPos = board.indexOf(EMPTY_TILE);
    const adjacent = getAdjacentPositions(emptyPos);

    // Filter out the last moved position to avoid undoing the previous move
    const validMoves = adjacent.filter(pos => pos !== lastMove);
    const randomPos = validMoves[Math.floor(Math.random() * validMoves.length)];

    // Swap
    [board[emptyPos], board[randomPos]] = [board[randomPos], board[emptyPos]];
    lastMove = emptyPos;
  }

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
