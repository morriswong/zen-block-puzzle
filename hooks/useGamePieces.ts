import { useState, useEffect, useCallback } from 'react';
import { PieceState, PieceDef } from '../types';
import { generateBatchPieces, checkBatchCompletion } from '../utils/batchManager';

export interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  piecesPlaced: number;
  totalPieces: number;
  percentComplete: number;
  currentBatchSize: number;
}

export interface UseGamePiecesReturn {
  pieces: PieceState[];
  setPieces: React.Dispatch<React.SetStateAction<PieceState[]>>;
  batchIndex: number;
  progress: BatchProgress;
  isGameComplete: boolean;
  spawnNextBatch: () => void;
}

interface UseGamePiecesProps {
  pieceDefinitions: PieceDef[];
  onComplete: (imageUrl: string) => void;
  imageUrl: string;
  fitToView: (pieces: PieceState[]) => void;
}

const BATCH_SIZE = 5;

/**
 * Hook for managing game pieces state and batch progression
 */
export const useGamePieces = ({
  pieceDefinitions,
  onComplete,
  imageUrl,
  fitToView
}: UseGamePiecesProps): UseGamePiecesReturn => {
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Calculate progress
  const totalBatches = Math.ceil(pieceDefinitions.length / BATCH_SIZE);
  const progress: BatchProgress = {
    currentBatch: batchIndex + 1,
    totalBatches,
    piecesPlaced: pieces.length,
    totalPieces: pieceDefinitions.length,
    percentComplete: (pieces.length / pieceDefinitions.length) * 100,
    currentBatchSize: pieces.length
  };

  // Spawn next batch
  const spawnNextBatch = useCallback(() => {
    const newPieces = generateBatchPieces(batchIndex, pieces, pieceDefinitions);
    if (newPieces.length > 0) {
      const allPieces = [...pieces, ...newPieces];
      setPieces(allPieces);

      // Auto-fit view to show new pieces
      setTimeout(() => fitToView(allPieces), 50);
    }
  }, [batchIndex, pieces, pieceDefinitions, fitToView]);

  // Initial spawn
  useEffect(() => {
    if (pieces.length === 0 && batchIndex === 0) {
      const initialPieces = generateBatchPieces(0, [], pieceDefinitions);
      setPieces(initialPieces);
      setTimeout(() => fitToView(initialPieces), 50);
    }
  }, [pieces.length, batchIndex, pieceDefinitions, fitToView]);

  // Check for batch completion and game completion
  useEffect(() => {
    if (pieces.length === 0) return;

    const { isComplete, isGameComplete: gameComplete } = checkBatchCompletion(
      pieces,
      pieceDefinitions.length
    );

    if (isComplete) {
      // Batch complete, spawn next batch
      const timer = setTimeout(() => {
        setBatchIndex(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }

    if (gameComplete) {
      // Game complete
      setIsGameComplete(true);
      const timer = setTimeout(() => {
        onComplete(imageUrl);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pieces, pieceDefinitions.length, onComplete, imageUrl]);

  // Trigger spawn when batch index changes
  useEffect(() => {
    if (batchIndex > 0) {
      spawnNextBatch();
    }
  }, [batchIndex]); // Only depend on batchIndex, not spawnNextBatch to avoid infinite loop

  return {
    pieces,
    setPieces,
    batchIndex,
    progress,
    isGameComplete,
    spawnNextBatch
  };
};
