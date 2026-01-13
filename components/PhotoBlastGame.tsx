import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { getImageUrl } from '../constants';
import { GameMenu } from './GameMenu';
import { useGameMenu } from '../hooks/useGameMenu';
import { useBlockBlast, BlockShape, GRID_SIZE, BLOCK_COLORS } from '../hooks/useBlockBlast';

interface PhotoBlastGameProps {
  onComplete: (imageUrl: string) => void;
  onRestart: () => void;
  onHome: () => void;
}

// Calculate grid cell size based on viewport
const calculateCellSize = (): number => {
  const padding = 48;
  const topBarHeight = 80;
  const blockAreaHeight = 140;
  const availableWidth = window.innerWidth - padding;
  const availableHeight = window.innerHeight - topBarHeight - blockAreaHeight - padding;

  const maxGridSize = Math.min(availableWidth, availableHeight);
  const cellSize = Math.floor(maxGridSize / GRID_SIZE);

  return Math.min(cellSize, 50);
};

// Block preview component
interface BlockPreviewProps {
  block: BlockShape | null;
  isSelected: boolean;
  onClick: () => void;
  cellSize: number;
}

const BlockPreview: React.FC<BlockPreviewProps> = ({ block, isSelected, onClick, cellSize }) => {
  if (!block) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-800/30 border border-white/5"
        style={{ width: cellSize * 3 + 16, height: cellSize * 3 + 16 }}
      />
    );
  }

  const previewCellSize = Math.min(cellSize * 0.7, 20);
  const pattern = block.pattern;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-lg p-2 transition-all duration-200
        ${isSelected
          ? 'bg-white/20 border-2 border-white/60 scale-110'
          : 'bg-gray-800/50 border border-white/10 hover:bg-gray-700/50'
        }
      `}
      style={{ width: cellSize * 3 + 16, height: cellSize * 3 + 16 }}
    >
      <div className="flex flex-col gap-0.5">
        {pattern.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <div
                key={c}
                className="rounded-sm transition-colors"
                style={{
                  width: previewCellSize,
                  height: previewCellSize,
                  backgroundColor: cell === 1 ? block.color : 'transparent',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </button>
  );
};

export const PhotoBlastGame: React.FC<PhotoBlastGameProps> = ({ onComplete, onRestart, onHome }) => {
  const imageUrl = useMemo(() => getImageUrl(), []);
  const [cellSize, setCellSize] = useState(() => calculateCellSize());
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // Update cell size on window resize
  useEffect(() => {
    const handleResize = () => {
      setCellSize(calculateCellSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gridSize = cellSize * GRID_SIZE;

  // Block blast logic
  const {
    grid,
    currentBlocks,
    progress,
    revealedRows,
    revealedCols,
    placeBlock,
    canPlaceBlock,
    canPlaceAnyBlock,
    resetGame,
  } = useBlockBlast({
    onComplete,
    imageUrl,
  });

  // Check for game over
  useEffect(() => {
    if (!canPlaceAnyBlock() && currentBlocks.some(b => b !== null)) {
      setGameOver(true);
    }
  }, [currentBlocks, canPlaceAnyBlock]);

  // Menu state
  const { isMenuOpen, openMenu, closeMenu } = useGameMenu();

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (selectedBlockIndex === null) return;

    const block = currentBlocks[selectedBlockIndex];
    if (!block) return;

    const success = placeBlock(selectedBlockIndex, row, col);
    if (success) {
      setSelectedBlockIndex(null);
      setHoverCell(null);
    }
  }, [selectedBlockIndex, currentBlocks, placeBlock]);

  // Handle block selection
  const handleBlockSelect = useCallback((index: number) => {
    if (currentBlocks[index]) {
      setSelectedBlockIndex(selectedBlockIndex === index ? null : index);
    }
  }, [currentBlocks, selectedBlockIndex]);

  // Handle menu actions
  const handleNewGame = () => {
    onRestart();
    closeMenu();
  };

  const handleShuffle = () => {
    resetGame();
    setSelectedBlockIndex(null);
    setGameOver(false);
    closeMenu();
  };

  // Check if a cell would be filled by the selected block at hover position
  const isBlockPreviewCell = useCallback((row: number, col: number): boolean => {
    if (selectedBlockIndex === null || !hoverCell) return false;
    const block = currentBlocks[selectedBlockIndex];
    if (!block) return false;

    const pattern = block.pattern;
    const relRow = row - hoverCell.row;
    const relCol = col - hoverCell.col;

    if (relRow >= 0 && relRow < pattern.length && relCol >= 0 && relCol < pattern[0].length) {
      return pattern[relRow][relCol] === 1;
    }
    return false;
  }, [selectedBlockIndex, currentBlocks, hoverCell]);

  // Get the color for preview
  const getPreviewColor = useCallback((): string => {
    if (selectedBlockIndex === null) return 'transparent';
    const block = currentBlocks[selectedBlockIndex];
    return block?.color || 'transparent';
  }, [selectedBlockIndex, currentBlocks]);

  // Check if placement would be valid
  const isValidPlacement = useCallback((): boolean => {
    if (selectedBlockIndex === null || !hoverCell) return false;
    const block = currentBlocks[selectedBlockIndex];
    if (!block) return false;
    return canPlaceBlock(block, hoverCell.row, hoverCell.col);
  }, [selectedBlockIndex, currentBlocks, hoverCell, canPlaceBlock]);

  // Check if a cell should show the photo (revealed)
  const isCellRevealed = useCallback((row: number, col: number): boolean => {
    return revealedRows.has(row) || revealedCols.has(col);
  }, [revealedRows, revealedCols]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex flex-col">
      {/* Frosted Glass Background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 backdrop-blur-3xl bg-black/70" />

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

        {/* Progress */}
        <div className="bg-black/50 text-white px-5 py-2 rounded-full backdrop-blur-md border border-white/10">
          <span className="text-sm font-medium">
            {progress.linesCleared}/{progress.totalLinesToClear} Lines
          </span>
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

      {/* Game Grid - Centered */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-2">
        <div
          className="relative bg-black/30 rounded-xl p-2 backdrop-blur-sm"
          style={{
            width: gridSize + 16,
            height: gridSize + 16,
          }}
        >
          {/* Photo underneath (revealed parts) */}
          <div
            className="absolute rounded-lg overflow-hidden"
            style={{
              top: 8,
              left: 8,
              width: gridSize,
              height: gridSize,
            }}
          >
            <img
              src={imageUrl}
              alt="Hidden"
              className="w-full h-full object-cover"
              style={{ imageRendering: 'auto' }}
            />
          </div>

          {/* Grid cells */}
          <div
            className="relative grid gap-0.5"
            style={{
              width: gridSize,
              height: gridSize,
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isRevealed = isCellRevealed(rowIndex, colIndex);
                const isPreview = isBlockPreviewCell(rowIndex, colIndex);
                const validPlacement = isValidPlacement();

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      relative rounded-sm transition-all duration-150 cursor-pointer
                      ${selectedBlockIndex !== null ? 'hover:ring-2 hover:ring-white/30' : ''}
                    `}
                    style={{
                      width: cellSize - 2,
                      height: cellSize - 2,
                      backgroundColor: cell.filled
                        ? BLOCK_COLORS[cell.colorIndex]
                        : isRevealed
                          ? 'transparent'
                          : isPreview
                            ? validPlacement
                              ? `${getPreviewColor()}80`
                              : '#ff000050'
                            : 'rgba(30, 30, 30, 0.9)',
                    }}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onMouseEnter={() => setHoverCell({ row: rowIndex, col: colIndex })}
                    onMouseLeave={() => setHoverCell(null)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Block Selection Area */}
      <div className="relative z-20 p-4 pb-6">
        <div className="flex justify-center gap-3">
          {currentBlocks.map((block, index) => (
            <BlockPreview
              key={index}
              block={block}
              isSelected={selectedBlockIndex === index}
              onClick={() => handleBlockSelect(index)}
              cellSize={cellSize}
            />
          ))}
        </div>

        {/* Hint text */}
        <p className="text-center text-white/40 text-xs mt-3">
          {gameOver
            ? 'No valid moves! Try again.'
            : selectedBlockIndex !== null
              ? 'Tap on the grid to place the block'
              : 'Tap a block to select it'
          }
        </p>
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/90 rounded-2xl p-6 text-center max-w-xs mx-4">
            <h2 className="text-white text-2xl font-bold mb-2">Game Over</h2>
            <p className="text-white/60 mb-4">
              You revealed {progress.linesCleared} of {progress.totalLinesToClear} lines
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleShuffle}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onHome}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Overlay */}
      <GameMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onShuffle={handleShuffle}
        onNewGame={handleNewGame}
        onHome={onHome}
      />
    </div>
  );
};
