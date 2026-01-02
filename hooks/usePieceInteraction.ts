import { useState, useCallback, useRef, useEffect } from 'react';
import { PieceState, Point, PieceDef } from '../types';
import { areNeighbors, getExpectedPosition } from '../utils/pieceMath';
import { BLOCK_SIZE } from '../constants';

export interface UsePieceInteractionReturn {
  mismatchLine: { p1: Point; p2: Point } | null;
  handlePointerDown: (e: React.PointerEvent, containerRef: React.RefObject<HTMLDivElement>) => void;
}

interface UsePieceInteractionProps {
  pieces: PieceState[];
  setPieces: React.Dispatch<React.SetStateAction<PieceState[]>>;
  pieceDefinitions: PieceDef[];
  pan: Point;
  setPan: React.Dispatch<React.SetStateAction<Point>>;
  zoom: number;
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  panStartRef: React.MutableRefObject<{ x: number; y: number }>;
  touchStateRef: React.MutableRefObject<{
    touches: Map<number, { x: number; y: number }>;
    lastDistance: number | null;
    lastCenter: { x: number; y: number } | null;
    isPanning: boolean;
    panStart: { x: number; y: number } | null;
  }>;
}

interface DragState {
  activeId: number | null;
  startPos: { x: number; y: number };
  groupOffsets: Map<number, { dx: number; dy: number }>;
  mouseStart: { x: number; y: number };
}

/**
 * Hook for managing piece drag/drop/snap interactions
 */
export const usePieceInteraction = ({
  pieces,
  setPieces,
  pieceDefinitions,
  pan,
  setPan,
  zoom,
  isPanning,
  setIsPanning,
  panStartRef,
  touchStateRef
}: UsePieceInteractionProps): UsePieceInteractionReturn => {
  const [mismatchLine, setMismatchLine] = useState<{ p1: Point; p2: Point } | null>(null);

  const dragRef = useRef<DragState>({
    activeId: null,
    startPos: { x: 0, y: 0 },
    groupOffsets: new Map(),
    mouseStart: { x: 0, y: 0 }
  });

  /**
   * Handle pointer down - start dragging piece or panning background
   */
  const handlePointerDown = useCallback((
    e: React.PointerEvent,
    containerRef: React.RefObject<HTMLDivElement>
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Transform to world coordinates
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    // Find clicked piece (highest z-index first)
    const clickedPiece = [...pieces].reverse().find(p => {
      const def = pieceDefinitions.find(d => d.id === p.id);
      if (!def) return false;

      return (
        worldX >= p.currentPos.x &&
        worldX <= p.currentPos.x + (def.width * BLOCK_SIZE) &&
        worldY >= p.currentPos.y &&
        worldY <= p.currentPos.y + (def.height * BLOCK_SIZE)
      );
    });

    if (clickedPiece) {
      // DRAG PIECE
      if (e.button === 2 || e.button === 1 || e.shiftKey) return;

      e.preventDefault();
      e.stopPropagation();

      const id = clickedPiece.id;

      // Bring group to front
      setPieces(prev => prev.map(p => ({
        ...p,
        zIndex: p.groupId === clickedPiece.groupId ? 100 : (p.zIndex > 50 ? 50 : p.zIndex)
      })));

      // Calculate offsets for all pieces in the group
      const groupOffsets = new Map<number, { dx: number, dy: number }>();
      pieces.filter(p => p.groupId === clickedPiece.groupId).forEach(p => {
        groupOffsets.set(p.id, {
          dx: p.currentPos.x - clickedPiece.currentPos.x,
          dy: p.currentPos.y - clickedPiece.currentPos.y
        });
      });

      dragRef.current = {
        activeId: id,
        startPos: { ...clickedPiece.currentPos },
        groupOffsets,
        mouseStart: { x: worldX, y: worldY },
      };
    } else {
      // PAN BACKGROUND
      if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    }
  }, [pieces, pieceDefinitions, pan, zoom, setPieces, setIsPanning, panStartRef]);

  /**
   * Handle pointer move - drag piece or pan background
   */
  const handlePointerMove = useCallback((e: PointerEvent) => {
    // Handle panning
    if (isPanning) {
      e.preventDefault();
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (touchStateRef.current.isPanning) return;

    const { activeId, startPos, mouseStart, groupOffsets } = dragRef.current;
    if (!activeId) return;

    const containerElement = document.querySelector('[data-game-container]') as HTMLElement;
    const rect = containerElement?.getBoundingClientRect();
    if (!rect) return;

    // Current world position
    const currentWorldX = (e.clientX - rect.left - pan.x) / zoom;
    const currentWorldY = (e.clientY - rect.top - pan.y) / zoom;

    const deltaX = currentWorldX - mouseStart.x;
    const deltaY = currentWorldY - mouseStart.y;

    // Proposed new position for the primary dragged piece
    const newMainPos = { x: startPos.x + deltaX, y: startPos.y + deltaY };

    // Update all group members
    const updatedPieces = pieces.map(p => {
      if (p.groupId === pieces.find(x => x.id === activeId)?.groupId) {
        const offset = groupOffsets.get(p.id) || { dx: 0, dy: 0 };
        return {
          ...p,
          currentPos: {
            x: newMainPos.x + offset.dx,
            y: newMainPos.y + offset.dy
          }
        };
      }
      return p;
    });

    setPieces(updatedPieces);

    // Check for mismatch (wrong neighbor proximity)
    let bestWrongMatch: { p1: Point, p2: Point } | null = null;
    const otherPieces = pieces.filter(p => !groupOffsets.has(p.id) && p.id !== activeId);

    const activePiece = updatedPieces.find(p => p.id === activeId);
    if (activePiece) {
      for (const other of otherPieces) {
        const dist = Math.hypot(
          activePiece.currentPos.x - other.currentPos.x,
          activePiece.currentPos.y - other.currentPos.y
        );
        if (dist < 150) {
          if (!areNeighbors(activePiece, other, pieceDefinitions)) {
            const defA = pieceDefinitions.find(d => d.id === activePiece.id)!;
            const defB = pieceDefinitions.find(d => d.id === other.id)!;
            const centerA = {
              x: activePiece.currentPos.x + (defA.width * BLOCK_SIZE) / 2,
              y: activePiece.currentPos.y + (defA.height * BLOCK_SIZE) / 2
            };
            const centerB = {
              x: other.currentPos.x + (defB.width * BLOCK_SIZE) / 2,
              y: other.currentPos.y + (defB.height * BLOCK_SIZE) / 2
            };
            bestWrongMatch = { p1: centerA, p2: centerB };
            break;
          }
        }
      }
    }
    setMismatchLine(bestWrongMatch);
  }, [pan, setPan, zoom, isPanning, pieces, pieceDefinitions, setPieces, panStartRef, touchStateRef]);

  /**
   * Handle pointer up - snap pieces together if they're neighbors
   */
  const handlePointerUp = useCallback(() => {
    setIsPanning(false);

    const { activeId } = dragRef.current;
    if (!activeId) return;

    setMismatchLine(null);

    let merged = false;
    let nextPieces = [...pieces];
    const draggedPiece = nextPieces.find(p => p.id === activeId);
    if (!draggedPiece) return;

    const sourceGroupId = draggedPiece.groupId;
    const sourceGroupPieces = nextPieces.filter(p => p.groupId === sourceGroupId);
    const targetGroupPieces = nextPieces.filter(p => p.groupId !== sourceGroupId);

    // Check if any piece in the dragged group is a neighbor to any other piece
    for (const sPiece of sourceGroupPieces) {
      if (merged) break;
      for (const tPiece of targetGroupPieces) {
        if (areNeighbors(sPiece, tPiece, pieceDefinitions)) {
          const idealPos = getExpectedPosition(tPiece, sPiece.id, pieceDefinitions);
          if (idealPos) {
            const adjustX = idealPos.x - sPiece.currentPos.x;
            const adjustY = idealPos.y - sPiece.currentPos.y;

            // Snap all pieces in the source group
            nextPieces = nextPieces.map(p => {
              if (p.groupId === sourceGroupId) {
                return {
                  ...p,
                  currentPos: {
                    x: p.currentPos.x + adjustX,
                    y: p.currentPos.y + adjustY
                  },
                  groupId: tPiece.groupId, // MERGE groups
                  zIndex: 10
                };
              }
              return p;
            });
            merged = true;
            break;
          }
        }
      }
    }

    if (merged) {
      setPieces(nextPieces);
    } else {
      // Just reset z-index
      setPieces(prev => prev.map(p =>
        p.groupId === sourceGroupId ? { ...p, zIndex: 10 } : p
      ));
    }

    dragRef.current.activeId = null;
    dragRef.current.groupOffsets.clear();
  }, [pieces, pieceDefinitions, setPieces, setIsPanning]);

  // Set up global listeners for pointer move and up
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    mismatchLine,
    handlePointerDown
  };
};
