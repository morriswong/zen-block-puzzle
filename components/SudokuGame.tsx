import React, { useState, useCallback } from 'react';
import { GameMenu } from './GameMenu';
import { useGameMenu } from '../hooks/useGameMenu';

interface SudokuGameProps {
  onComplete: (imageUrl: string) => void;
  onRestart: () => void;
  onHome: () => void;
}

// Simple Sudoku puzzle (0 = empty cell)
const INITIAL_PUZZLE: number[][] = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const SOLUTION: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

export const SudokuGame: React.FC<SudokuGameProps> = ({ onComplete, onRestart, onHome }) => {
  const [grid, setGrid] = useState<number[][]>(() =>
    INITIAL_PUZZLE.map(row => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const { isMenuOpen, openMenu, closeMenu } = useGameMenu();

  // Check if a cell is part of the original puzzle (not editable)
  const isOriginal = (row: number, col: number): boolean => {
    return INITIAL_PUZZLE[row][col] !== 0;
  };

  // Check if the puzzle is solved
  const checkCompletion = useCallback((currentGrid: number[][]) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentGrid[row][col] !== SOLUTION[row][col]) {
          return false;
        }
      }
    }
    return true;
  }, []);

  // Handle number input
  const handleNumberInput = (num: number) => {
    if (!selectedCell || isOriginal(selectedCell.row, selectedCell.col)) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = num;
    setGrid(newGrid);

    if (checkCompletion(newGrid)) {
      setIsComplete(true);
      setTimeout(() => {
        onComplete('');
      }, 1000);
    }
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (!isOriginal(row, col)) {
      setSelectedCell({ row, col });
    }
  };

  // Get cell background color
  const getCellStyle = (row: number, col: number) => {
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isOriginalCell = isOriginal(row, col);
    const isCorrect = grid[row][col] === SOLUTION[row][col] && grid[row][col] !== 0;
    const isWrong = grid[row][col] !== 0 && grid[row][col] !== SOLUTION[row][col];

    let bgColor = 'bg-gray-800';
    if (isSelected) bgColor = 'bg-blue-600';
    else if (isWrong) bgColor = 'bg-red-900/50';
    else if (isCorrect && !isOriginalCell) bgColor = 'bg-green-900/30';

    const textColor = isOriginalCell ? 'text-white' : 'text-blue-300';

    // Add thicker borders for 3x3 boxes
    const borderRight = col % 3 === 2 && col !== 8 ? 'border-r-2 border-r-white/30' : '';
    const borderBottom = row % 3 === 2 && row !== 8 ? 'border-b-2 border-b-white/30' : '';

    return `${bgColor} ${textColor} ${borderRight} ${borderBottom}`;
  };

  // Calculate progress
  const filledCells = grid.flat().filter(n => n !== 0).length;
  const totalCells = 81;
  const progress = Math.round((filledCells / totalCells) * 100);

  return (
    <div className="relative w-full h-full overflow-hidden touch-none bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="w-full p-4 flex justify-between items-center z-50">
        <button
          onClick={onHome}
          className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          title="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>

        {/* Progress HUD */}
        <div className="bg-black/50 text-white px-5 py-2 rounded-full backdrop-blur-md flex flex-col items-center min-w-[140px] border border-white/10">
          <span className="text-sm font-medium mb-1">
            {progress}% Complete
          </span>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400/50 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={openMenu}
          className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          title="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Sudoku Grid */}
        <div className="grid grid-cols-9 gap-[1px] bg-white/20 p-[2px] rounded-lg">
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-lg sm:text-xl font-medium border border-white/10 transition-colors ${getCellStyle(rowIndex, colIndex)}`}
              >
                {cell !== 0 ? cell : ''}
              </button>
            ))
          )}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-9 gap-2 max-w-md">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xl font-medium transition-colors"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Clear button */}
        <button
          onClick={() => handleNumberInput(0)}
          className="px-6 py-2 bg-red-900/50 hover:bg-red-900/70 rounded-lg text-white font-medium transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Completion overlay */}
      {isComplete && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-green-400 mb-4">Puzzle Solved!</h2>
            <p className="text-white/70">Great job!</p>
          </div>
        </div>
      )}

      {/* Menu Overlay */}
      <GameMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onResetView={() => {
          setGrid(INITIAL_PUZZLE.map(row => [...row]));
          setSelectedCell(null);
          closeMenu();
        }}
        onNewGame={onRestart}
        onHome={onHome}
      />
    </div>
  );
};
