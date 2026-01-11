import React from 'react';
import { GRID_SIZE, EMPTY_TILE } from '../constants';

interface TileProps {
  tileValue: number;      // 0-7 for image tiles, 8 for empty
  position: number;       // 0-8 grid position
  imageUrl: string;
  onClick: () => void;
  isAdjacent: boolean;    // Can this tile be moved?
  tileSize: number;       // Dynamic tile size based on viewport
}

export const Tile: React.FC<TileProps> = ({
  tileValue,
  position,
  imageUrl,
  onClick,
  isAdjacent,
  tileSize,
}) => {
  // Calculate grid position for this tile
  const row = Math.floor(position / GRID_SIZE);
  const col = position % GRID_SIZE;

  // Calculate the background position based on which tile this is (its original position)
  const tileRow = Math.floor(tileValue / GRID_SIZE);
  const tileCol = tileValue % GRID_SIZE;
  const bgX = -tileCol * tileSize;
  const bgY = -tileRow * tileSize;

  // Use transform for GPU-accelerated smooth animation
  const x = col * tileSize;
  const y = row * tileSize;

  // Empty tile
  if (tileValue === EMPTY_TILE) {
    return (
      <div
        className="absolute"
        style={{
          transform: `translate3d(${x}px, ${y}px, 0)`,
          width: tileSize,
          height: tileSize,
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`absolute select-none will-change-transform ${
        isAdjacent
          ? 'cursor-pointer hover:brightness-110 active:scale-[0.97]'
          : 'cursor-default'
      }`}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: tileSize,
        height: tileSize,
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundSize: `${tileSize * GRID_SIZE}px ${tileSize * GRID_SIZE}px`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.4)',
        borderRadius: '6px',
        // Smooth, snappy animation with custom cubic-bezier
        transition: 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 150ms ease',
      }}
    />
  );
};
