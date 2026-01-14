import React from 'react';
import { IMAGE_SIZE } from '../constants';

interface EndScreenProps {
  imageUrl: string;
  onRestart: () => void;
  gameType?: string;
}

export const EndScreen: React.FC<EndScreenProps> = ({ imageUrl, onRestart, gameType }) => {
  const isPhotoBlast = gameType === 'photo-blast';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 z-50 animate-in zoom-in-95 duration-700">

      <div className="text-center mb-8 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">
        <h2 className="text-3xl font-light text-emerald-400 tracking-wide mb-2">
          {isPhotoBlast ? '🎉 Photo Revealed!' : 'Harmony Restored'}
        </h2>
        <p className="text-white/40 text-sm">
          {isPhotoBlast ? 'You uncovered the hidden image!' : 'The puzzle is complete.'}
        </p>
      </div>

      <div
        className={`relative shadow-2xl rounded-sm overflow-hidden border-4 mx-4 ${
          isPhotoBlast
            ? 'border-yellow-500/50 animate-in zoom-in-50 duration-1000'
            : 'border-white/5'
        }`}
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
        {/* Shine effect - more dramatic for photo blast */}
        <div className={`absolute inset-0 pointer-events-none ${
          isPhotoBlast
            ? 'bg-gradient-to-tr from-yellow-500/20 via-transparent to-white/20'
            : 'bg-gradient-to-tr from-white/10 to-transparent'
        }`} />

        {/* Sparkle overlay for photo blast */}
        {isPhotoBlast && (
          <div className="absolute inset-0 pointer-events-none animate-pulse">
            <div className="absolute top-2 left-2 text-2xl">✨</div>
            <div className="absolute top-2 right-2 text-2xl">✨</div>
            <div className="absolute bottom-2 left-2 text-2xl">✨</div>
            <div className="absolute bottom-2 right-2 text-2xl">✨</div>
          </div>
        )}
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