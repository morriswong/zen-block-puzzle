import React from 'react';

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onResetView: () => void;
  onNewGame: () => void;
  onHome: () => void;
}

/**
 * Game menu overlay component
 */
export const GameMenu: React.FC<GameMenuProps> = ({
  isOpen,
  onClose,
  onResetView,
  onNewGame,
  onHome
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Game Menu</h2>

        <button
          onClick={onClose}
          className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Continue
        </button>

        <div className="h-px bg-gray-600 my-2" />

        <button
          onClick={onResetView}
          className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
          Reset View
        </button>

        <button
          onClick={onNewGame}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          New Game
        </button>

        <button
          onClick={onHome}
          className="w-full py-4 bg-red-900/50 hover:bg-red-900/80 text-red-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 mt-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Quit to Home
        </button>
      </div>
    </div>
  );
};
