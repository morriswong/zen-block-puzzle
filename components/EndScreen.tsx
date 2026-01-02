import React from 'react';
import { IMAGE_SIZE } from '../constants';

interface EndScreenProps {
  imageUrl: string;
  onRestart: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ imageUrl, onRestart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 z-50 animate-in zoom-in-95 duration-700">
      
      <div className="text-center mb-8 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">
        <h2 className="text-3xl font-light text-emerald-400 tracking-wide mb-2">Harmony Restored</h2>
        <p className="text-white/40 text-sm">The puzzle is complete.</p>
      </div>

      <div 
        className="relative shadow-2xl rounded-sm overflow-hidden border-4 border-white/5 mx-4"
        style={{
          width: 'min(80vw, 400px)',
          aspectRatio: '1/1',
        }}
      >
        <img 
          src={imageUrl} 
          alt="Completed Puzzle" 
          className="w-full h-full object-cover"
        />
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
      </div>

      <button
        onClick={onRestart}
        className="mt-12 px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-medium tracking-wide transition-all border border-white/10 hover:border-white/30"
      >
        Play New Game
      </button>
    </div>
  );
};