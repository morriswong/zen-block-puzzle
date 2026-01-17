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
  onDragStart: (index: number, clientX: number, clientY: number) => void;
  onRotate: (index: number) => void;
  isDragging: boolean;
}

const DRAG_THRESHOLD = 10; // Pixels to move before considering it a drag

const DraggableBlock: React.FC<DraggableBlockProps> = ({
  block,
  index,
  cellSize,
  onDragStart,
  onRotate,
  isDragging,
}) => {
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!block) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    startPosRef.current = { x: clientX, y: clientY };
    hasDraggedRef.current = false;
  }, [block]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!startPosRef.current || hasDraggedRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = Math.abs(clientX - startPosRef.current.x);
    const dy = Math.abs(clientY - startPosRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      hasDraggedRef.current = true;
      onDragStart(index, clientX, clientY);
    }
  }, [index, onDragStart]);

  const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!startPosRef.current) return;

    // If we didn't drag, it's a tap - rotate the block
    if (!hasDraggedRef.current) {
      onRotate(index);
    }

    startPosRef.current = null;
    hasDraggedRef.current = false;
  }, [index, onRotate]);

  // Cancel interaction without triggering rotation (for mouse leave, touch cancel)
  const handlePointerCancel = useCallback(() => {
    startPosRef.current = null;
    hasDraggedRef.current = false;
  }, []);

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
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerCancel}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerCancel}
    >
      <div className="flex flex-col gap-0.5 pointer-events-none">
        {pattern.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <div
                key={c}
                className="rounded-sm transition-all duration-150"
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
    clearedRows,
    clearedCols,
    placeBlock,
    canPlaceBlock,
    rotateBlock,
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

  // Handle drag start (called from DraggableBlock when drag threshold is exceeded)
  const handleDragStart = useCallback((index: number, clientX: number, clientY: number) => {
    if (!currentBlocks[index]) return;

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
        <div className="flex flex-col items-center gap-1">
          {/* Column indicators (top) */}
          <div className="flex gap-0.5" style={{ marginLeft: 24 }}>
            {Array.from({ length: GRID_SIZE }).map((_, col) => (
              <div
                key={col}
                className="flex items-center justify-center text-xs"
                style={{
                  width: cellSize - 2,
                  height: 16,
                  color: clearedCols.has(col) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                }}
              >
                {clearedCols.has(col) ? '✓' : '○'}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Row indicators (left) */}
            <div className="flex flex-col gap-0.5">
              {Array.from({ length: GRID_SIZE }).map((_, row) => (
                <div
                  key={row}
                  className="flex items-center justify-center text-xs"
                  style={{
                    width: 16,
                    height: cellSize - 2,
                    color: clearedRows.has(row) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {clearedRows.has(row) ? '✓' : '○'}
                </div>
              ))}
            </div>

            {/* Main Grid */}
            <div
              ref={gridRef}
              className="relative bg-black/30 rounded-xl p-2 backdrop-blur-sm"
              style={{
                width: gridSize + 16,
                height: gridSize + 16,
              }}
            >
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
                    const isPreview = previewCells.has(`${rowIndex}-${colIndex}`);
                    const previewColor = draggingBlock?.color || '#ffffff';
                    const actualCellSize = cellSize - 2;

                    // Check if this cell should show the image (row OR column has been cleared)
                    const isRevealed = clearedRows.has(rowIndex) || clearedCols.has(colIndex);

                    // Determine cell style
                    let cellStyle: React.CSSProperties = {
                      width: actualCellSize,
                      height: actualCellSize,
                    };

                    if (cell.filled) {
                      // Player-placed block
                      cellStyle.backgroundColor = BLOCK_COLORS[cell.colorIndex];
                    } else if (isRevealed) {
                      // Revealed cell - show image portion
                      cellStyle.backgroundImage = `url(${imageUrl})`;
                      cellStyle.backgroundPosition = `${-colIndex * actualCellSize}px ${-rowIndex * actualCellSize}px`;
                      cellStyle.backgroundSize = `${actualCellSize * GRID_SIZE}px ${actualCellSize * GRID_SIZE}px`;
                    } else if (isPreview) {
                      // Preview overlay
                      cellStyle.backgroundColor = isValidDrop ? `${previewColor}60` : '#ff444460';
                    } else {
                      // Unrevealed empty cell
                      cellStyle.backgroundColor = 'rgba(40, 40, 40, 0.95)';
                    }

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="relative rounded-sm transition-all duration-100"
                        style={cellStyle}
                      />
                    );
                  })
                )}
              </div>
            </div>
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
              onRotate={rotateBlock}
              isDragging={draggingIndex === index}
            />
          ))}
        </div>

        {/* Hint text */}
        <p className="text-center text-white/40 text-xs mt-3">
          Clear all rows or columns to reveal the photo!
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
