import React from 'react';

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShuffle: () => void;
  onNewGame: () => void;
  onHome: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  isOpen,
  onClose,
  onShuffle,
  onNewGame,
  onHome
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl border border-gray-700 mx-4">
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
          onClick={onShuffle}
          className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
            <path d="m18 2 4 4-4 4" />
            <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
            <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
            <path d="m18 14 4 4-4 4" />
          </svg>
          Shuffle
        </button>

        <button
          onClick={onNewGame}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="M15 3v18" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
          </svg>
          New Image
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
