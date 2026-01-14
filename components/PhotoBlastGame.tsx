import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
  const blockAreaHeight = 160;
  const availableWidth = window.innerWidth - padding;
  const availableHeight = window.innerHeight - topBarHeight - blockAreaHeight - padding;

  const maxGridSize = Math.min(availableWidth, availableHeight);
  const cellSize = Math.floor(maxGridSize / GRID_SIZE);

  return Math.min(cellSize, 50);
};

// Draggable block preview component
interface DraggableBlockProps {
  block: BlockShape | null;
  index: number;
  cellSize: number;
  onDragStart: (index: number, e: React.MouseEvent | React.TouchEvent) => void;
  isDragging: boolean;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({
  block,
  index,
  cellSize,
  onDragStart,
  isDragging,
}) => {
  if (!block) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-800/30 border border-white/5"
        style={{ width: cellSize * 2.5 + 16, height: cellSize * 2.5 + 16 }}
      />
    );
  }

  const previewCellSize = Math.min(cellSize * 0.6, 18);
  const pattern = block.pattern;

  return (
    <div
      className={`
        flex items-center justify-center rounded-lg p-2 cursor-grab active:cursor-grabbing
        bg-gray-800/50 border border-white/10 hover:bg-gray-700/50 hover:scale-105
        transition-all duration-200 touch-none select-none
        ${isDragging ? 'opacity-30 scale-95' : ''}
      `}
      style={{ width: cellSize * 2.5 + 16, height: cellSize * 2.5 + 16 }}
      onMouseDown={(e) => onDragStart(index, e)}
      onTouchStart={(e) => onDragStart(index, e)}
    >
      <div className="flex flex-col gap-0.5 pointer-events-none">
        {pattern.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <div
                key={c}
                className="rounded-sm"
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
    </div>
  );
};

// Floating drag preview
interface DragPreviewProps {
  block: BlockShape;
  position: { x: number; y: number };
  cellSize: number;
  isValid: boolean;
}

const DragPreview: React.FC<DragPreviewProps> = ({ block, position, cellSize, isValid }) => {
  const pattern = block.pattern;
  const blockCellSize = cellSize - 2;

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`flex flex-col gap-0.5 transition-opacity ${isValid ? 'opacity-90' : 'opacity-60'}`}
      >
        {pattern.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <div
                key={c}
                className="rounded-sm shadow-lg"
                style={{
                  width: blockCellSize,
                  height: blockCellSize,
                  backgroundColor: cell === 1
                    ? isValid ? block.color : '#ff4444'
                    : 'transparent',
                  boxShadow: cell === 1 ? '0 4px 12px rgba(0,0,0,0.4)' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PhotoBlastGame: React.FC<PhotoBlastGameProps> = ({ onComplete, onRestart, onHome }) => {
  const imageUrl = useMemo(() => getImageUrl(), []);
  const [cellSize, setCellSize] = useState(() => calculateCellSize());

  // Drag state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [targetCell, setTargetCell] = useState<{ row: number; col: number } | null>(null);

  // Grid ref for position calculations
  const gridRef = useRef<HTMLDivElement>(null);

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
    resetGame,
  } = useBlockBlast({
    onComplete,
    imageUrl,
  });

  // Menu state
  const { isMenuOpen, openMenu, closeMenu } = useGameMenu();

  // Calculate which grid cell the drag is over
  const calculateTargetCell = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current || draggingIndex === null) return null;

    const block = currentBlocks[draggingIndex];
    if (!block) return null;

    const gridRect = gridRef.current.getBoundingClientRect();
    const gridLeft = gridRect.left + 8; // Account for padding
    const gridTop = gridRect.top + 8;

    // Calculate center of block pattern
    const patternHeight = block.pattern.length;
    const patternWidth = block.pattern[0].length;

    // Offset to place from top-left of block pattern
    const offsetX = (patternWidth * cellSize) / 2;
    const offsetY = (patternHeight * cellSize) / 2;

    const relX = clientX - gridLeft - offsetX + cellSize / 2;
    const relY = clientY - gridTop - offsetY + cellSize / 2;

    const col = Math.floor(relX / cellSize);
    const row = Math.floor(relY / cellSize);

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return { row, col };
    }

    return null;
  }, [cellSize, draggingIndex, currentBlocks]);

  // Handle drag start
  const handleDragStart = useCallback((index: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!currentBlocks[index]) return;

    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDraggingIndex(index);
    setDragPosition({ x: clientX, y: clientY });
  }, [currentBlocks]);

  // Handle drag move
  useEffect(() => {
    if (draggingIndex === null) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      setDragPosition({ x: clientX, y: clientY });
      setTargetCell(calculateTargetCell(clientX, clientY));
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (draggingIndex !== null && targetCell) {
        const block = currentBlocks[draggingIndex];
        if (block && canPlaceBlock(block, targetCell.row, targetCell.col)) {
          placeBlock(draggingIndex, targetCell.row, targetCell.col);
        }
      }

      setDraggingIndex(null);
      setDragPosition(null);
      setTargetCell(null);
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [draggingIndex, targetCell, currentBlocks, canPlaceBlock, placeBlock, calculateTargetCell]);

  // Check if dragging block can be placed at target
  const isValidDrop = useMemo(() => {
    if (draggingIndex === null || !targetCell) return false;
    const block = currentBlocks[draggingIndex];
    if (!block) return false;
    return canPlaceBlock(block, targetCell.row, targetCell.col);
  }, [draggingIndex, targetCell, currentBlocks, canPlaceBlock]);

  // Get cells that would be filled by the dragging block
  const getPreviewCells = useCallback((): Set<string> => {
    const cells = new Set<string>();
    if (draggingIndex === null || !targetCell) return cells;

    const block = currentBlocks[draggingIndex];
    if (!block) return cells;

    const pattern = block.pattern;
    for (let r = 0; r < pattern.length; r++) {
      for (let c = 0; c < pattern[0].length; c++) {
        if (pattern[r][c] === 1) {
          cells.add(`${targetCell.row + r}-${targetCell.col + c}`);
        }
      }
    }
    return cells;
  }, [draggingIndex, targetCell, currentBlocks]);

  const previewCells = getPreviewCells();

  // Handle menu actions
  const handleNewGame = () => {
    onRestart();
    closeMenu();
  };

  const handleShuffle = () => {
    resetGame();
    closeMenu();
  };

  // Check if a cell should show the photo (revealed)
  const isCellRevealed = useCallback((row: number, col: number): boolean => {
    return revealedRows.has(row) || revealedCols.has(col);
  }, [revealedRows, revealedCols]);

  // Get dragging block for preview
  const draggingBlock = draggingIndex !== null ? currentBlocks[draggingIndex] : null;

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
          ref={gridRef}
          className="relative bg-black/30 rounded-xl p-2 backdrop-blur-sm"
          style={{
            width: gridSize + 16,
            height: gridSize + 16,
          }}
        >
          {/* Grid cells - Photo is HIDDEN during gameplay */}
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
                const isPreview = previewCells.has(`${rowIndex}-${colIndex}`);
                const previewColor = draggingBlock?.color || '#ffffff';

                // Revealed cells show a golden "cleared" glow instead of the photo
                // Photo only revealed on victory screen
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`relative rounded-sm transition-all duration-200 ${
                      isRevealed ? 'shadow-inner' : ''
                    }`}
                    style={{
                      width: cellSize - 2,
                      height: cellSize - 2,
                      backgroundColor: cell.filled
                        ? BLOCK_COLORS[cell.colorIndex]
                        : isRevealed
                          ? '#2a2a2a' // Dark "cleared" area - photo hidden
                          : isPreview
                            ? isValidDrop
                              ? `${previewColor}60`
                              : '#ff444460'
                            : 'rgba(40, 40, 40, 0.95)',
                      // Add subtle glow effect for revealed cells
                      boxShadow: isRevealed
                        ? 'inset 0 0 8px rgba(234, 179, 8, 0.3)'
                        : 'none',
                    }}
                  >
                    {/* Sparkle indicator for revealed cells */}
                    {isRevealed && (
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-20"
                        style={{ fontSize: cellSize * 0.4 }}
                      >
                        ✨
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Block Selection Area */}
      <div className="relative z-20 p-4 pb-6">
        <div className="flex justify-center gap-4">
          {currentBlocks.map((block, index) => (
            <DraggableBlock
              key={index}
              block={block}
              index={index}
              cellSize={cellSize}
              onDragStart={handleDragStart}
              isDragging={draggingIndex === index}
            />
          ))}
        </div>

        {/* Hint text */}
        <p className="text-center text-white/40 text-xs mt-3">
          Clear all 16 lines to reveal the hidden photo!
        </p>
      </div>

      {/* Drag Preview */}
      {draggingBlock && dragPosition && (
        <DragPreview
          block={draggingBlock}
          position={dragPosition}
          cellSize={cellSize}
          isValid={isValidDrop}
        />
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
