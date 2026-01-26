import { useState, useEffect, useCallback, useMemo } from 'react';
import { FOOD_CATEGORIES, FoodCategory } from '../constants';
import { fetchFoodImage, FoodImageData } from '../utils/unsplashApi';
import { PhotoGuessingProgress } from '../types';

type GameStatus = 'loading' | 'playing' | 'won' | 'lost';

interface UsePhotoGuessingProps {
  onComplete: (imageUrl: string) => void;
}

interface UsePhotoGuessingReturn {
  imageData: FoodImageData | null;
  options: string[];
  correctAnswer: string;
  attemptsRemaining: number;
  gameStatus: GameStatus;
  selectedAnswer: string | null;
  showFeedback: boolean;
  currentZoomLevel: number;
  progress: PhotoGuessingProgress;
  makeGuess: (category: string) => void;
  resetGame: () => void;
}

// Zoom levels based on attempts remaining
const ZOOM_LEVELS = {
  3: 150,  // Very zoomed - 150px crop of 600px image (4x zoom)
  2: 300,  // Medium zoom - 300px crop (2x zoom)
  1: 600,  // Full reveal - entire 600px image
  0: 600,  // Game over - full reveal
};

/**
 * Generate 4 multiple choice options (1 correct + 3 random distractors)
 * Shuffles the options so correct answer is not always in same position
 */
const generateOptions = (correctCategory: FoodCategory): string[] => {
  const incorrect = FOOD_CATEGORIES
    .filter(cat => cat !== correctCategory)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const all = [correctCategory, ...incorrect];

  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all;
};

/**
 * Select a random food category from available categories
 */
const selectRandomCategory = (): FoodCategory => {
  const randomIndex = Math.floor(Math.random() * FOOD_CATEGORIES.length);
  return FOOD_CATEGORIES[randomIndex];
};

export const usePhotoGuessing = ({
  onComplete,
}: UsePhotoGuessingProps): UsePhotoGuessingReturn => {
  const [imageData, setImageData] = useState<FoodImageData | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [gameStatus, setGameStatus] = useState<GameStatus>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Calculate current zoom level based on attempts
  const currentZoomLevel = useMemo(() => {
    return ZOOM_LEVELS[attemptsRemaining as keyof typeof ZOOM_LEVELS] || 600;
  }, [attemptsRemaining]);

  // Initialize game - fetch image and generate options
  const initializeGame = useCallback(async () => {
    setGameStatus('loading');
    setHasCompleted(false);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAttemptsRemaining(3);

    const category = selectRandomCategory();
    const image = await fetchFoodImage(category);

    setImageData(image);
    setCorrectAnswer(image.category);
    setOptions(generateOptions(image.category as FoodCategory));
    setGameStatus('playing');
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Handle guess
  const makeGuess = useCallback((category: string) => {
    if (gameStatus !== 'playing' || showFeedback) return;

    setSelectedAnswer(category);
    setShowFeedback(true);

    if (category === correctAnswer) {
      // Correct answer
      setGameStatus('won');
    } else {
      // Wrong answer
      const newAttempts = attemptsRemaining - 1;
      setAttemptsRemaining(newAttempts);

      if (newAttempts === 0) {
        // Out of attempts
        setGameStatus('lost');
      } else {
        // Still have attempts left - hide feedback and allow next guess
        setTimeout(() => {
          setShowFeedback(false);
          setSelectedAnswer(null);
        }, 1000);
      }
    }
  }, [gameStatus, showFeedback, correctAnswer, attemptsRemaining]);

  // Check for completion and trigger onComplete callback
  useEffect(() => {
    if ((gameStatus === 'won' || gameStatus === 'lost') && !hasCompleted) {
      setHasCompleted(true);
      const delay = gameStatus === 'won' ? 1000 : 1500;
      setTimeout(() => {
        onComplete(imageData?.url || '');
      }, delay);
    }
  }, [gameStatus, hasCompleted, onComplete, imageData]);

  // Reset game with new image
  const resetGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  // Progress object
  const progress: PhotoGuessingProgress = useMemo(() => ({
    attemptsRemaining,
    currentZoomLevel,
    isComplete: gameStatus === 'won' || gameStatus === 'lost',
  }), [attemptsRemaining, currentZoomLevel, gameStatus]);

  return {
    imageData,
    options,
    correctAnswer,
    attemptsRemaining,
    gameStatus,
    selectedAnswer,
    showFeedback,
    currentZoomLevel,
    progress,
    makeGuess,
    resetGame,
  };
};
