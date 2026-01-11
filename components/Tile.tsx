import React from 'react';
import { TILE_SIZE, GRID_SIZE, EMPTY_TILE } from '../constants';

interface TileProps {
  tileValue: number;      // 0-7 for image tiles, 8 for empty
  position: number;       // 0-8 grid position
  imageUrl: string;
  onClick: () => void;
  isAdjacent: boolean;    // Can this tile be moved?
}

export const Tile: React.FC<TileProps> = ({
  tileValue,
  position,
  imageUrl,
  onClick,
  isAdjacent,
}) => {
  // Calculate grid position for this tile
  const row = Math.floor(position / GRID_SIZE);
  const col = position % GRID_SIZE;

  // Calculate the background position based on which tile this is (its original position)
  const tileRow = Math.floor(tileValue / GRID_SIZE);
  const tileCol = tileValue % GRID_SIZE;
  const bgX = -tileCol * TILE_SIZE;
  const bgY = -tileRow * TILE_SIZE;

  // Empty tile
  if (tileValue === EMPTY_TILE) {
    return (
      <div
        className="absolute"
        style={{
          left: col * TILE_SIZE,
          top: row * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`absolute select-none transition-all duration-200 ease-out ${
        isAdjacent
          ? 'cursor-pointer hover:brightness-110 active:scale-95'
          : 'cursor-default'
      }`}
      style={{
        left: col * TILE_SIZE,
        top: row * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundSize: `${TILE_SIZE * GRID_SIZE}px ${TILE_SIZE * GRID_SIZE}px`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)',
        borderRadius: '4px',
      }}
    />
  );
};
