import React, { useRef, useMemo } from 'react';
import { PIECE_DEFINITIONS, getImageUrl } from '../constants';
import { PuzzlePiece } from './PuzzlePiece';
import { GameHUD } from './GameHUD';
import { GameMenu } from './GameMenu';
import { useGameMenu } from '../hooks/useGameMenu';
import { useGamePieces } from '../hooks/useGamePieces';
import { useViewportTransform } from '../hooks/useViewportTransform';
import { usePieceInteraction } from '../hooks/usePieceInteraction';

interface GameProps {
  onComplete: (imageUrl: string) => void;
  onRestart: () => void;
  onHome: () => void;
}

export const Game: React.FC<GameProps> = ({ onComplete, onRestart, onHome }) => {
  const imageUrl = useMemo(() => getImageUrl(), []);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transform (pan/zoom)
  const {
    pan,
    setPan,
    zoom,
    isPanning,
    setIsPanning,
    isAnimating,
    fitToView,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    panStartRef,
    touchStateRef
  } = useViewportTransform({ pieceDefinitions: PIECE_DEFINITIONS });

  // Game pieces state
  const {
    pieces,
    setPieces,
    progress
  } = useGamePieces({
    pieceDefinitions: PIECE_DEFINITIONS,
    onComplete,
    imageUrl,
    fitToView
  });

  // Piece interaction (drag/drop/snap)
  const {
    mismatchLine,
    handlePointerDown
  } = usePieceInteraction({
    pieces,
    setPieces,
    pieceDefinitions: PIECE_DEFINITIONS,
    pan,
    setPan,
    zoom,
    isPanning,
    setIsPanning,
    panStartRef,
    touchStateRef
  });

  // Menu state
  const { isMenuOpen, openMenu, closeMenu } = useGameMenu();

  // Handle menu actions
  const handleResetView = () => {
    resetView();
    closeMenu();
  };

  const handleNewGameClick = () => {
    onRestart();
    closeMenu();
  };

  return (
    <div
      ref={containerRef}
      data-game-container
      className="relative w-full h-full overflow-hidden touch-none bg-black"
      onWheel={handleWheel}
      onPointerDown={(e) => handlePointerDown(e, containerRef)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Frosted Glass Background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.6
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 backdrop-blur-3xl bg-black/60" />

      {/* Viewport Transform Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isAnimating ? 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Pieces */}
        {pieces.map(piece => (
          <PuzzlePiece
            key={piece.id}
            definition={PIECE_DEFINITIONS.find(d => d.id === piece.id)!}
            state={piece}
            imageUrl={imageUrl}
          />
        ))}

        {/* Mismatch Red Line */}
        {mismatchLine && (
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <line
              x1={mismatchLine.p1.x}
              y1={mismatchLine.p1.y}
              x2={mismatchLine.p2.x}
              y2={mismatchLine.p2.y}
              stroke="red"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="10,5"
            />
          </svg>
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center pointer-events-none z-50">
        {/* Home Button (Top Left) */}
        <button
          onClick={onHome}
          className="pointer-events-auto w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          title="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>

        {/* Game HUD (Center) */}
        <GameHUD progress={progress} showProgressBar={false} />

        {/* Menu Button (Top Right) */}
        <button
          onClick={openMenu}
          className="pointer-events-auto w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          title="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Menu Overlay */}
      <GameMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onResetView={handleResetView}
        onNewGame={handleNewGameClick}
        onHome={onHome}
      />
    </div>
  );
};
