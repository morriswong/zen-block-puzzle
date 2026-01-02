import React from 'react';
import { BLOCK_SIZE } from '../constants';
import { PieceDef, PieceState } from '../types';

interface PuzzlePieceProps {
  definition: PieceDef;
  state: PieceState;
  imageUrl: string;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({ definition, state, imageUrl }) => {
  const { currentPos, zIndex } = state;

  return (
    <div
      data-piece="true"
      className="absolute select-none touch-none cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`,
        width: definition.width * BLOCK_SIZE,
        height: definition.height * BLOCK_SIZE,
        zIndex: zIndex,
        pointerEvents: 'auto',
        transition: 'none',
      }}
    >
      {definition.blocks.map((block, index) => {
        const bgX = -1 * (definition.origin.x + block.x) * BLOCK_SIZE;
        const bgY = -1 * (definition.origin.y + block.y) * BLOCK_SIZE;

        return (
          <div
            key={index}
            className="absolute shadow-sm"
            style={{
              left: block.x * BLOCK_SIZE,
              top: block.y * BLOCK_SIZE,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: `${bgX}px ${bgY}px`,
              backgroundRepeat: 'no-repeat',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)',
            }}
          />
        );
      })}

      {/* Highlight effect when dragging */}
      {zIndex >= 50 && (
        <div className="absolute inset-0 pointer-events-none border-2 border-white/50 rounded-sm" />
      )}
    </div>
  );
};
