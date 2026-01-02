import React from 'react';
import { BatchProgress } from '../hooks/useGamePieces';

interface GameHUDProps {
  progress: BatchProgress;
  showProgressBar?: boolean;
}

/**
 * Game HUD component displaying piece count and optional progress bar
 */
export const GameHUD: React.FC<GameHUDProps> = ({
  progress,
  showProgressBar = false
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
      <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
        Pieces: {progress.piecesPlaced} / {progress.totalPieces}
      </span>

      {showProgressBar && (
        <div className="mt-2 text-center text-xs text-white/70">
          Phase {progress.currentBatch} of {progress.totalBatches} - {Math.round(progress.percentComplete)}%
        </div>
      )}
    </div>
  );
};
