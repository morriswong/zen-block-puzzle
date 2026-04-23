import React, { useRef } from 'react';

type GameType = 'block-puzzle' | 'sudoku' | 'photo-blast';

interface StartScreenProps {
  onSelectGame: (game: GameType, imageUrl?: string) => void;
}

const PREVIEW_IMAGE_URL = 'https://picsum.photos/id/1018/192/192';
const BLOCK_COLORS: Record<number, string> = {
  1: '#FF6B6B',
  2: '#4ECDC4',
  3: '#45B7D1',
  4: '#96CEB4',
  5: '#FFEAA7',
  6: '#DDA0DD',
};
const CELL = 24;

const PREVIEW_BOARD: (number | 'r')[][] = [
  ['r', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
  ['r', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
  [0, 1, 1, 0, 0, 2, 2, 0],
  [0, 1, 0, 0, 0, 0, 2, 0],
  [3, 3, 0, 4, 4, 0, 0, 0],
  [0, 0, 0, 4, 0, 0, 0, 5],
  [0, 0, 6, 6, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const GamePreview: React.FC = () => (
  <div className="flex flex-col items-center gap-3">
    <div
      className="rounded-xl overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${CELL}px)`,
        gridTemplateRows: `repeat(8, ${CELL}px)`,
        gap: '1px',
        backgroundColor: 'rgba(0,0,0,0.6)',
      }}
    >
      {PREVIEW_BOARD.flatMap((row, rowIdx) =>
        row.map((cell, colIdx) =>
          cell === 'r' ? (
            <div
              key={`${rowIdx}-${colIdx}`}
              style={{
                backgroundImage: `url(${PREVIEW_IMAGE_URL})`,
                backgroundSize: `${CELL * 8}px ${CELL * 8}px`,
                backgroundPosition: `-${colIdx * CELL}px -${rowIdx * CELL}px`,
              }}
            />
          ) : (
            <div
              key={`${rowIdx}-${colIdx}`}
              style={{
                backgroundColor: cell === 0 ? 'rgb(20, 20, 20)' : BLOCK_COLORS[cell as number],
                borderRadius: cell !== 0 ? '2px' : undefined,
              }}
            />
          )
        )
      )}
    </div>
    <span className="bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full">
      2 / 8 Lines
    </span>
  </div>
);

export const StartScreen: React.FC<StartScreenProps> = ({ onSelectGame }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 600;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onSelectGame('photo-blast', dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-gray-950 z-50 overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="text-center pt-12 pb-2 flex-shrink-0">
        <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-3">Zen Puzzles</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl leading-none">💥</span>
          <h1 className="text-5xl font-black tracking-[0.2em] text-white uppercase leading-none">
            BLAST
          </h1>
        </div>
      </div>

      {/* Game Preview */}
      <div className="mt-8 flex-shrink-0">
        <GamePreview />
      </div>

      {/* Tagline */}
      <p className="mt-8 text-white/50 text-sm text-center px-6 flex-shrink-0">
        Place blocks. Clear lines. Reveal the photo.
      </p>

      {/* CTA Buttons */}
      <div className="w-full px-6 mt-8 flex flex-col gap-3 flex-shrink-0">
        <button
          onClick={() => onSelectGame('photo-blast')}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-700 active:scale-95 transition-all"
        >
          Play Now
        </button>
        <button
          onClick={handlePhotoUpload}
          className="w-full py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>📷</span>
          <span>Upload Your Photo</span>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto py-6 flex-shrink-0">
        <p className="text-white/20 text-xs tracking-[0.2em] uppercase">Prototype v1.0</p>
      </div>
    </div>
  );
};
