import React from 'react';
import { getImageUrl } from '../constants';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50 animate-in fade-in duration-700">
      {/* Background Ambience */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none blur-3xl scale-110"
        style={{
          backgroundImage: `url(${getImageUrl()})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      
      <div className="relative z-10 text-center p-8 max-w-md">
        <h1 className="text-6xl font-thin tracking-tighter text-white mb-6 drop-shadow-lg">
          Zen<span className="font-bold text-emerald-400">Block</span>
        </h1>
        
        <p className="text-gray-300 text-lg mb-12 font-light leading-relaxed">
          Restore the image. <br/>
          Find peace in the pieces.
        </p>

        <button
          onClick={onStart}
          className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full border border-white/30 hover:border-emerald-400 transition-colors duration-300"
        >
          <div className="absolute inset-0 w-0 bg-emerald-500/10 transition-all duration-[250ms] ease-out group-hover:w-full opacity-50" />
          <span className="relative text-xl tracking-widest uppercase font-medium text-white group-hover:text-emerald-300 transition-colors">
            Begin
          </span>
        </button>
      </div>
      
      <div className="absolute bottom-8 text-white/20 text-xs tracking-[0.2em] uppercase">
        Prototype v1.0
      </div>
    </div>
  );
};