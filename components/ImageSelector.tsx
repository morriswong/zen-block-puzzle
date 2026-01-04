import React, { useState } from 'react';
import { ImageOptions } from '../constants';

interface ImageSelectorProps {
  onSelect: (options: ImageOptions) => void;
  currentOptions: ImageOptions;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({ onSelect, currentOptions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [grayscale, setGrayscale] = useState(currentOptions.grayscale || false);
  const [useCurated, setUseCurated] = useState(currentOptions.useCurated !== false); // Default to true

  const handleModeChange = (newUseCurated: boolean) => {
    setUseCurated(newUseCurated);
    onSelect({
      useCurated: newUseCurated,
      grayscale
    });
  };

  const handleGrayscaleToggle = () => {
    const newGrayscale = !grayscale;
    setGrayscale(newGrayscale);
    onSelect({
      useCurated,
      grayscale: newGrayscale
    });
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:border-emerald-400/50 transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/70 group-hover:text-emerald-400 transition-colors"
        >
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m5.2-13.2-4.2 4.2m0 6 4.2 4.2M23 12h-6m-6 0H5m13.2 5.2-4.2-4.2m0-6-4.2-4.2"/>
        </svg>
        <span className="text-white/90 text-sm font-medium">Settings</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-medium text-sm">Game Settings</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Image Mode Selection */}
            <div>
              <label className="text-white/70 text-xs uppercase tracking-wide mb-2 block">
                Image Quality
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => handleModeChange(true)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${
                    useCurated
                      ? 'bg-emerald-500/20 border border-emerald-400/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {useCurated ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white/90 text-sm font-medium mb-1">Curated (Recommended)</div>
                    <div className="text-white/50 text-xs leading-relaxed">
                      Hand-picked images with clear details and variety. Perfect for solving.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeChange(false)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${
                    !useCurated
                      ? 'bg-emerald-500/20 border border-emerald-400/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {!useCurated ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white/90 text-sm font-medium mb-1">Completely Random</div>
                    <div className="text-white/50 text-xs leading-relaxed">
                      Any random image. May include uniform or challenging images.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Difficulty Settings */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-white/70 text-xs uppercase tracking-wide mb-3 block">
                Difficulty
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={handleGrayscaleToggle}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-white/90 text-sm group-hover:text-white transition-colors">
                    Grayscale Mode
                  </div>
                  <div className="text-white/50 text-xs">
                    Easier to solve by focusing on shapes
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
