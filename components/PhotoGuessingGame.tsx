import React from 'react';
import { usePhotoGuessing } from '../hooks/usePhotoGuessing';
import { GameMenu } from './GameMenu';
import { useGameMenu } from '../hooks/useGameMenu';

interface PhotoGuessingGameProps {
  onComplete: (imageUrl: string) => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PhotoGuessingGame: React.FC<PhotoGuessingGameProps> = ({
  onComplete,
  onRestart,
  onHome,
}) => {
  const {
    imageData,
    options,
    correctAnswer,
    attemptsRemaining,
    gameStatus,
    selectedAnswer,
    showFeedback,
    currentZoomLevel,
    makeGuess,
    resetGame,
  } = usePhotoGuessing({ onComplete });

  const { isMenuOpen, openMenu, closeMenu } = useGameMenu();

  // Handle menu actions
  const handleNewGame = () => {
    onRestart();
    closeMenu();
  };

  const handleShuffle = () => {
    resetGame();
    closeMenu();
  };

  // Calculate zoom style for the image
  const viewportSize = 300;
  const imageScale = viewportSize / currentZoomLevel;

  // Capitalize first letter of each word for display
  const formatCategoryName = (category: string): string => {
    return category
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Determine button style based on state
  const getButtonClassName = (option: string): string => {
    const baseClass = 'px-6 py-4 rounded-xl text-base font-semibold transition-all duration-300 min-h-[60px]';

    if (!showFeedback) {
      return `${baseClass} bg-gray-700/80 hover:bg-gray-600/80 hover:scale-105 text-white backdrop-blur-sm border border-white/10`;
    }

    if (option === correctAnswer && gameStatus === 'lost') {
      // Show correct answer when lost
      return `${baseClass} bg-green-500 text-white animate-pulse`;
    }

    if (option === selectedAnswer) {
      if (option === correctAnswer) {
        // Correct answer
        return `${baseClass} bg-green-500 text-white animate-pulse`;
      } else {
        // Wrong answer
        return `${baseClass} bg-red-500 text-white animate-shake`;
      }
    }

    // Other options when feedback is showing
    return `${baseClass} bg-gray-700/50 text-gray-400 opacity-50 cursor-not-allowed`;
  };

  const isButtonDisabled = (option: string): boolean => {
    if (showFeedback) {
      return option !== selectedAnswer;
    }
    return false;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex flex-col">
      {/* Frosted Glass Background */}
      {imageData && (
        <>
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `url(${imageData.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3,
            }}
          />
          <div className="absolute inset-0 pointer-events-none z-0 backdrop-blur-3xl bg-black/70" />
        </>
      )}

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

        {/* Attempts Counter */}
        <div className="bg-black/50 text-white px-5 py-2 rounded-full backdrop-blur-md border border-white/10">
          <span className="text-sm font-medium">
            {attemptsRemaining}/3 Attempts
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

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 gap-6">
        {/* Loading State */}
        {gameStatus === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Loading image...</p>
          </div>
        )}

        {/* Game Content */}
        {gameStatus !== 'loading' && imageData && (
          <>
            {/* Photo Viewport */}
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative overflow-hidden rounded-full shadow-2xl border-4 border-white/20"
                style={{
                  width: viewportSize,
                  height: viewportSize,
                }}
              >
                <img
                  src={imageData.url}
                  alt="Mystery food"
                  className="absolute"
                  style={{
                    width: `${600 * imageScale}px`,
                    height: `${600 * imageScale}px`,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    objectFit: 'cover',
                  }}
                />
              </div>

              {/* Instruction Text */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {gameStatus === 'lost' ? 'Out of Attempts!' : 'Guess the food!'}
                </h2>
                {gameStatus === 'playing' && !showFeedback && (
                  <p className="text-white/60 text-sm">
                    Tap an answer below
                  </p>
                )}
                {gameStatus === 'playing' && showFeedback && selectedAnswer !== correctAnswer && (
                  <p className="text-yellow-400 text-sm animate-pulse">
                    Try again! Take a closer look...
                  </p>
                )}
                {gameStatus === 'won' && (
                  <p className="text-green-400 text-sm animate-pulse">
                    Correct! 🎉
                  </p>
                )}
                {gameStatus === 'lost' && (
                  <p className="text-red-400 text-sm">
                    It was {formatCategoryName(correctAnswer)}!
                  </p>
                )}
              </div>
            </div>

            {/* Multiple Choice Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md px-4">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => makeGuess(option)}
                  disabled={isButtonDisabled(option)}
                  className={getButtonClassName(option)}
                >
                  {formatCategoryName(option)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Menu Overlay */}
      <GameMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onShuffle={handleShuffle}
        onNewGame={handleNewGame}
        onHome={onHome}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
