import React, { useState } from 'react';
import { ImageOptions, getImageUrl } from '../constants';

interface ImageSelectorProps {
  onSelect: (options: ImageOptions) => void;
  currentOptions: ImageOptions;
}

// Curated list of Picsum images that work well for puzzles
// These IDs were selected to have varied colors and clear details
const CURATED_IMAGE_IDS = [
  { id: 0, label: 'Random' },
  { id: 237, label: 'Mountain Lake' },
  { id: 1015, label: 'City Street' },
  { id: 1018, label: 'Forest Path' },
  { id: 1025, label: 'Colorful Birds' },
  { id: 180, label: 'Beach Sunset' },
  { id: 1043, label: 'Architecture' },
  { id: 367, label: 'Autumn Trees' },
  { id: 1074, label: 'Urban Scene' },
  { id: 292, label: 'Coastal View' },
  { id: 659, label: 'Building Detail' },
];

export const ImageSelector: React.FC<ImageSelectorProps> = ({ onSelect, currentOptions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [grayscale, setGrayscale] = useState(currentOptions.grayscale || false);
  const [selectedId, setSelectedId] = useState(currentOptions.id);

  const handleImageSelect = (id: number | undefined) => {
    setSelectedId(id);
    onSelect({ id, grayscale });
    setIsExpanded(false);
  };

  const handleGrayscaleToggle = () => {
    const newGrayscale = !grayscale;
    setGrayscale(newGrayscale);
    onSelect({ id: selectedId, grayscale: newGrayscale });
  };

  const currentLabel = selectedId
    ? CURATED_IMAGE_IDS.find(img => img.id === selectedId)?.label || `Image #${selectedId}`
    : 'Random';

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
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
        <span className="text-white/90 text-sm font-medium">{currentLabel}</span>
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
        <div className="absolute top-full mt-2 right-0 w-64 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-medium text-sm">Select Image</h3>
          </div>

          {/* Image Grid */}
          <div className="max-h-96 overflow-y-auto p-3 space-y-2">
            {CURATED_IMAGE_IDS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleImageSelect(id === 0 ? undefined : id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  (id === 0 && !selectedId) || id === selectedId
                    ? 'bg-emerald-500/20 border border-emerald-400/50'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                {id === 0 ? (
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    ?
                  </div>
                ) : (
                  <img
                    src={`https://picsum.photos/id/${id}/100`}
                    alt={label}
                    className="w-12 h-12 rounded object-cover"
                    loading="lazy"
                  />
                )}
                <span className="text-white/90 text-sm flex-1 text-left">{label}</span>
                {((id === 0 && !selectedId) || id === selectedId) && (
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
                    className="text-emerald-400"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-t border-white/10 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={handleGrayscaleToggle}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                Grayscale (easier)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
