import React from 'react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  icon?: string;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  gameName,
  icon = '🎮',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-2">{gameName}</h2>
        <p className="text-gray-400 mb-6">Coming Soon</p>
        <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-pink-500 mx-auto rounded-full mb-6" />
        <p className="text-gray-500 text-sm mb-6">
          We're working hard to bring you this puzzle. Stay tuned!
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
