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
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
      <div className="bg-black/50 text-white px-5 py-2 rounded-full backdrop-blur-md flex flex-col items-center min-w-[140px] border border-white/10">
        <span className="text-sm font-medium mb-1">
          Pieces: {progress.piecesPlaced} / {progress.totalPieces}
        </span>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/50 transition-all duration-700 ease-out"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
      </div>

      {showProgressBar && (
        <div className="mt-2 text-center text-xs text-white/70">
          Phase {progress.currentBatch} of {progress.totalBatches} - {Math.round(progress.percentComplete)}%
        </div>
      )}
    </div>
  );
};
