import React, { useMemo, useState, useEffect } from 'react';
import { getImageUrl, GRID_SIZE, EMPTY_TILE } from '../constants';
import { Tile } from './Tile';
import { GameMenu } from './GameMenu';
import { useGameMenu } from '../hooks/useGameMenu';
import { useSlidingPuzzle } from '../hooks/useSlidingPuzzle';

interface GameProps {
  onComplete: (imageUrl: string) => void;
  onRestart: () => void;
  onHome: () => void;
}

// Check if a position is adjacent to the empty tile
const isAdjacentToEmpty = (board: number[], position: number): boolean => {
  const emptyPos = board.indexOf(EMPTY_TILE);
  const emptyRow = Math.floor(emptyPos / GRID_SIZE);
  const emptyCol = emptyPos % GRID_SIZE;
  const tileRow = Math.floor(position / GRID_SIZE);
  const tileCol = position % GRID_SIZE;

  const rowDiff = Math.abs(emptyRow - tileRow);
  const colDiff = Math.abs(emptyCol - tileCol);

  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

// Calculate tile size based on viewport
const calculateTileSize = (): number => {
  const padding = 48; // 24px padding on each side
  const topBarHeight = 80; // Approximate height of top bar
  const availableWidth = window.innerWidth - padding;
  const availableHeight = window.innerHeight - topBarHeight - padding;

  // Use the smaller dimension to ensure square puzzle fits
  const maxPuzzleSize = Math.min(availableWidth, availableHeight);

  // Calculate tile size (puzzle is 3x3)
  const tileSize = Math.floor(maxPuzzleSize / GRID_SIZE);

  // Cap at 200px per tile for larger screens
  return Math.min(tileSize, 200);
};

export const Game: React.FC<GameProps> = ({ onComplete, onRestart, onHome }) => {
  const imageUrl = useMemo(() => getImageUrl(), []);
  const [tileSize, setTileSize] = useState(() => calculateTileSize());

  // Update tile size on window resize
  useEffect(() => {
    const handleResize = () => {
      setTileSize(calculateTileSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const puzzleSize = tileSize * GRID_SIZE;

  // Sliding puzzle logic
  const { board, progress, moveTile, shuffle } = useSlidingPuzzle({
    onComplete,
    imageUrl,
  });

  // Menu state
  const { isMenuOpen, openMenu, closeMenu } = useGameMenu();

  // Handle menu actions
  const handleNewGameClick = () => {
    shuffle();
    closeMenu();
  };

  const handleNewGame = () => {
    onRestart();
    closeMenu();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex flex-col">
      {/* Frosted Glass Background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4,
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 backdrop-blur-3xl bg-black/60" />

      {/* Top Bar */}
      <div className="relative z-50 p-4 flex justify-between items-center">
        {/* Home Button */}
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

        {/* Moves Counter */}
        <div className="bg-black/50 text-white px-5 py-2 rounded-full backdrop-blur-md border border-white/10">
          <span className="text-sm font-medium">Moves: {progress.moves}</span>
        </div>

        {/* Menu Button */}
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

      {/* Puzzle Grid - Centered */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-4">
        <div
          className="relative bg-black/30 rounded-xl p-2 backdrop-blur-sm"
          style={{
            width: puzzleSize + 16,
            height: puzzleSize + 16,
          }}
        >
          <div
            className="relative"
            style={{
              width: puzzleSize,
              height: puzzleSize,
            }}
          >
            {/* Render tiles in fixed order (by tileValue) so DOM elements stay consistent */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tileValue) => {
              const position = board.indexOf(tileValue);
              return (
                <Tile
                  key={`tile-${tileValue}`}
                  tileValue={tileValue}
                  position={position}
                  imageUrl={imageUrl}
                  onClick={() => moveTile(position)}
                  isAdjacent={isAdjacentToEmpty(board, position)}
                  tileSize={tileSize}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      <GameMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onShuffle={handleNewGameClick}
        onNewGame={handleNewGame}
        onHome={onHome}
      />
    </div>
  );
};
