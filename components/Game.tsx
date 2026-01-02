import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { IMAGE_SIZE, PIECE_DEFINITIONS, SNAP_THRESHOLD, BLOCK_SIZE, getImageUrl } from '../constants';
import { PieceState, Point } from '../types';
import { PuzzlePiece } from './PuzzlePiece';

interface GameProps {
  onComplete: (imageUrl: string) => void;
}

// Helper: Check if two pieces should be neighbors
// Returns true if piece A is adjacent to piece B in the solution grid
// and their relative position matches that relationship.
const areNeighbors = (p1: PieceState, p2: PieceState): boolean => {
  const def1 = PIECE_DEFINITIONS.find(d => d.id === p1.id);
  const def2 = PIECE_DEFINITIONS.find(d => d.id === p2.id);
  if (!def1 || !def2) return false;

  // Expected relative distance in grid units
  const gridDiffX = (def2.origin.x - def1.origin.x) * BLOCK_SIZE;
  const gridDiffY = (def2.origin.y - def1.origin.y) * BLOCK_SIZE;

  // Current relative distance
  const currentDiffX = p2.currentPos.x - p1.currentPos.x;
  const currentDiffY = p2.currentPos.y - p1.currentPos.y;

  // Check if they are close enough to the expected relative position
  const dist = Math.hypot(currentDiffX - gridDiffX, currentDiffY - gridDiffY);
  return dist < SNAP_THRESHOLD;
};

// Helper: Get expected position of p2 relative to p1
const getExpectedPosition = (p1: PieceState, p2Id: number): Point | null => {
  const def1 = PIECE_DEFINITIONS.find(d => d.id === p1.id);
  const def2 = PIECE_DEFINITIONS.find(d => d.id === p2Id);
  if (!def1 || !def2) return null;

  const diffX = (def2.origin.x - def1.origin.x) * BLOCK_SIZE;
  const diffY = (def2.origin.y - def1.origin.y) * BLOCK_SIZE;

  return {
    x: p1.currentPos.x + diffX,
    y: p1.currentPos.y + diffY
  };
};

interface GameProps {
  onComplete: (imageUrl: string) => void;
  onRestart: () => void;
  onHome: () => void;
}

export const Game: React.FC<GameProps> = ({ onComplete, onRestart, onHome }) => {
  const imageUrl = useMemo(() => getImageUrl(), []);

  // Viewport State
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Menu State

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Game/Piece State
  // We'll manage pieces in a single array. New batches are appended.
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);

  // Mismatch Line State
  const [mismatchLine, setMismatchLine] = useState<{ p1: Point; p2: Point } | null>(null);

  // Interaction Refs
  const dragRef = useRef<{
    activeId: number | null;
    startPos: { x: number; y: number }; // Initial pos of the DRAGGED piece
    groupOffsets: Map<number, { dx: number; dy: number }>; // Offsets of other group members relative to dragged piece
    mouseStart: { x: number; y: number };
  }>({ activeId: null, startPos: { x: 0, y: 0 }, groupOffsets: new Map(), mouseStart: { x: 0, y: 0 } });

  // Touch handling ref
  const touchStateRef = useRef<{
    touches: Map<number, { x: number; y: number }>;
    lastDistance: number | null;
    lastCenter: { x: number; y: number } | null;
    isPanning: boolean;
    panStart: { x: number; y: number } | null;
  }>({
    touches: new Map(),
    lastDistance: null,
    lastCenter: null,
    isPanning: false,
    panStart: null,
  });

  // --- Initialization & Batching ---

  // Helper: Fit view to show all pieces
  const fitToView = useCallback((currentPieces: PieceState[]) => {
    if (currentPieces.length === 0) return;

    // Calculate bounds of all pieces
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    currentPieces.forEach(p => {
      const def = PIECE_DEFINITIONS.find(d => d.id === p.id);
      const w = (def?.width || 1) * BLOCK_SIZE;
      const h = (def?.height || 1) * BLOCK_SIZE;

      minX = Math.min(minX, p.currentPos.x);
      minY = Math.min(minY, p.currentPos.y);
      maxX = Math.max(maxX, p.currentPos.x + w);
      maxY = Math.max(maxY, p.currentPos.y + h);
    });

    // Add padding
    const PADDING = 100;
    const contentW = maxX - minX + (PADDING * 2);
    const contentH = maxY - minY + (PADDING * 2);
    const contentCenterX = minX + (maxX - minX) / 2;
    const contentCenterY = minY + (maxY - minY) / 2;

    // Determine target zoom
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // Scale to fit nicely
    const scaleX = viewW / contentW;
    const scaleY = viewH / contentH;
    let targetZoom = Math.min(scaleX, scaleY);

    // Clamp zoom levels
    targetZoom = Math.max(0.2, Math.min(2.0, targetZoom)); // Don't zoom in too much automatically

    // Calculate Pan to center the content
    // We want contentCenter to be at screen center
    // ScreenCenter = (ViewW/2, ViewH/2)
    // World point -> Screen: screenX = worldX * zoom + panX
    // panX = screenX - worldX * zoom

    const targetPanX = (viewW / 2) - (contentCenterX * targetZoom);
    const targetPanY = (viewH / 2) - (contentCenterY * targetZoom);

    // Animate or set directly? Setting directly for now for responsiveness
    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, []);

  // Spawn new batch
  const spawnBatch = useCallback((batchIdx: number, currentPieces: PieceState[]) => {
    const BATCH_SIZE = 5;
    const startIdx = batchIdx * BATCH_SIZE;
    const endIdx = startIdx + BATCH_SIZE;

    // Get definitions for this batch
    const batchDefs = PIECE_DEFINITIONS.slice(startIdx, endIdx);
    if (batchDefs.length === 0) return; // No more pieces

    const newPieces: PieceState[] = [];

    // Calculate Occupied Regions (World Space)
    const occupiedRects: { x: number; y: number; w: number; h: number }[] = currentPieces.map(p => {
      const def = PIECE_DEFINITIONS.find(d => d.id === p.id);
      return {
        x: p.currentPos.x,
        y: p.currentPos.y,
        w: (def?.width || 1) * BLOCK_SIZE,
        h: (def?.height || 1) * BLOCK_SIZE
      };
    });

    // Determine "center" of current mess to spawn near it, but outwards
    // If empty, use (0,0) as center
    let centerX = 0, centerY = 0;
    if (occupiedRects.length > 0) {
      const bounds = occupiedRects.reduce((acc, r) => ({
        minX: Math.min(acc.minX, r.x),
        maxX: Math.max(acc.maxX, r.x + r.w),
        minY: Math.min(acc.minY, r.y),
        maxY: Math.max(acc.maxY, r.y + r.h),
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      centerX = (bounds.minX + bounds.maxX) / 2;
      centerY = (bounds.minY + bounds.maxY) / 2;
    } else {
      // First batch: Center in "World 0,0" roughly
      // We'll let fitToView handle centering on screen later
      centerX = 0;
      centerY = 0;
    }

    batchDefs.forEach((def, i) => {
      const w = def.width * BLOCK_SIZE;
      const h = def.height * BLOCK_SIZE;

      // Simple Spiral / Radial Search
      // Start from a radius and increase
      let radius = (occupiedRects.length > 0) ? Math.max(500, occupiedRects.length * 50) : 100; // Start further out if crowded
      let angle = (Math.PI * 2 * (i / batchDefs.length)) + (Math.random()); // Spread out

      let bestPos = { x: 0, y: 0 };
      let placed = false;
      const MARGIN = 40; // Space between pieces

      // Try 50 attempts with increasing radius
      for (let attempt = 0; attempt < 50; attempt++) {
        const testX = centerX + Math.cos(angle) * (radius + (attempt * 20)); // Spiral out
        const testY = centerY + Math.sin(angle) * (radius + (attempt * 20));

        // Rotate angle slightly for next attempt
        angle += 0.5;

        const testRect = { x: testX, y: testY, w: w + MARGIN, h: h + MARGIN };

        const hasOverlap = occupiedRects.some(r => {
          return (
            testRect.x < r.x + r.w &&
            testRect.x + testRect.w > r.x &&
            testRect.y < r.y + r.h &&
            testRect.y + testRect.h > r.y
          );
        });

        if (!hasOverlap) {
          bestPos = { x: testX, y: testY };
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Fallback: Just put it far away
        bestPos = { x: centerX + 1000 + (i * 200), y: centerY };
      }

      occupiedRects.push({ x: bestPos.x, y: bestPos.y, w, h });

      newPieces.push({
        id: def.id,
        currentPos: bestPos,
        targetPos: { x: 0, y: 0 },
        isLocked: false,
        zIndex: 10 + def.id,
        groupId: def.id,
      });
    });

    const allPieces = [...currentPieces, ...newPieces];
    setPieces(allPieces);

    // Auto-fit view to show new pieces
    // Timeout to allow state update? Not strictly needed for calculation, 
    // but better user experience to see it happen
    setTimeout(() => fitToView(allPieces), 50);

  }, [fitToView]);

  // Initial Spawn
  useEffect(() => {
    // Only spawn if empty
    if (pieces.length === 0 && batchIndex === 0) {
      spawnBatch(0, []);
    }
  }, [spawnBatch, batchIndex, pieces.length]);

  // Check for Batch Completion
  useEffect(() => {
    if (pieces.length === 0) return;

    const uniqueGroups = new Set(pieces.map(p => p.groupId));

    if (uniqueGroups.size === 1 && pieces.length < PIECE_DEFINITIONS.length) {
      const timer = setTimeout(() => {
        setBatchIndex(prev => {
          const next = prev + 1;
          spawnBatch(next, pieces);
          return next;
        });
      }, 500);
      return () => clearTimeout(timer);
    }

    // Win Condition
    if (uniqueGroups.size === 1 && pieces.length === PIECE_DEFINITIONS.length) {
      const timer = setTimeout(() => {
        onComplete(imageUrl);
      }, 1000);
      return () => clearTimeout(timer);
    }

  }, [pieces, onComplete, imageUrl, spawnBatch]);


  // --- Event Handling ---

  // START POINTER (Mouse/Touch Down)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Check if we clicked a piece
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Transform to world coordinates
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    // Find clicked piece (highest z-index first)
    // We reverse the array to search from top (last drawn) to bottom
    const clickedPiece = [...pieces].reverse().find(p => {
      const def = PIECE_DEFINITIONS.find(d => d.id === p.id);
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
      if (e.button === 2 || e.button === 1 || e.shiftKey) return; // Optional: Ignore right click on pieces if we want

      e.preventDefault();
      e.stopPropagation();

      const id = clickedPiece.id;

      // Bring group to front
      setPieces(prev => prev.map(p => ({
        ...p,
        zIndex: p.groupId === clickedPiece.groupId ? 100 : (p.zIndex > 50 ? 50 : p.zIndex)
      })));

      // Calculate offsets
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
        mouseStart: { x: worldX, y: worldY }, // Store WORLD pos for easier delta calc
      };

    } else {
      // PAN BACKGROUND
      // Allow left click (button 0) to pan if not on a piece
      if (e.button === 0 || e.button === 1) { // Left or Middle
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    }
  };

  // DRAG MOVE
  const handlePointerMove = useCallback((e: PointerEvent) => {
    // Handle Panning (if active)
    if (isPanning) {
      e.preventDefault();
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (touchStateRef.current.isPanning) return; // Touch pan handled separately

    const { activeId, startPos, mouseStart, groupOffsets } = dragRef.current;
    if (!activeId) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Current World Pos
    const currentWorldX = (e.clientX - rect.left - pan.x) / zoom;
    const currentWorldY = (e.clientY - rect.top - pan.y) / zoom;

    const deltaX = currentWorldX - mouseStart.x;
    const deltaY = currentWorldY - mouseStart.y;

    // Proposed new pos for the *primary dragged piece*
    const newMainPos = { x: startPos.x + deltaX, y: startPos.y + deltaY };

    // Update ALL group members
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

    // ... Mismatch logic (same as before) ...
    let bestWrongMatch: { p1: Point, p2: Point } | null = null;
    const draggedGroup = pieces.filter(p => p.id === activeId || groupOffsets.has(p.id));
    const otherPieces = pieces.filter(p => !groupOffsets.has(p.id) && p.id !== activeId);

    const activePiece = updatedPieces.find(p => p.id === activeId);
    if (activePiece) {
      for (const other of otherPieces) {
        const dist = Math.hypot(
          activePiece.currentPos.x - other.currentPos.x,
          activePiece.currentPos.y - other.currentPos.y
        );
        if (dist < 150) {
          if (!areNeighbors(activePiece, other)) {
            const defA = PIECE_DEFINITIONS.find(d => d.id === activePiece.id)!;
            const defB = PIECE_DEFINITIONS.find(d => d.id === other.id)!;
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

  }, [pan, zoom, isPanning, pieces]);


  // DROP / SNAP (Same as before largely, just clean up)
  const handlePointerUp = useCallback(() => {
    setIsPanning(false); // Stop panning if we were panning

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

    for (const sPiece of sourceGroupPieces) {
      if (merged) break;
      for (const tPiece of targetGroupPieces) {
        if (areNeighbors(sPiece, tPiece)) {
          const idealPos = getExpectedPosition(tPiece, sPiece.id);
          if (idealPos) {
            const adjustX = idealPos.x - sPiece.currentPos.x;
            const adjustY = idealPos.y - sPiece.currentPos.y;
            nextPieces = nextPieces.map(p => {
              if (p.groupId === sourceGroupId) {
                return {
                  ...p,
                  currentPos: {
                    x: p.currentPos.x + adjustX,
                    y: p.currentPos.y + adjustY
                  },
                  groupId: tPiece.groupId, // MERGE
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
      setPieces(prev => prev.map(p => p.groupId === sourceGroupId ? { ...p, zIndex: 10 } : p));
    }

    dragRef.current.activeId = null;
    dragRef.current.groupOffsets.clear();
  }, [pieces]);


  // Clean up global listeners
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // -- Standard Pan/Zoom Handlers (Similar to original) --
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(3, zoom * delta)); // Allow more zoom out
    if (newZoom !== zoom) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomPointX = (mouseX - pan.x) / zoom;
        const zoomPointY = (mouseY - pan.y) / zoom;
        setPan({
          x: mouseX - zoomPointX * newZoom,
          y: mouseY - zoomPointY * newZoom,
        });
      }
      setZoom(newZoom);
    }
  }, [zoom, pan]);


  // -- Touch Handling --

  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getTouchCenter = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getTouchDistance(t1, t2);
      const center = getTouchCenter(t1, t2);

      touchStateRef.current = {
        ...touchStateRef.current,
        lastDistance: dist,
        lastCenter: center,
        isPanning: true,
        panStart: { x: center.x - pan.x, y: center.y - pan.y }
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      const newDist = getTouchDistance(t1, t2);
      const newCenter = getTouchCenter(t1, t2);

      // ZOOM
      if (touchStateRef.current.lastDistance) {
        const delta = newDist / touchStateRef.current.lastDistance;
        const newZoom = Math.max(0.2, Math.min(3, zoom * delta));

        // Adjust pan to zoom towards center
        // Current world point at center
        const worldX = (newCenter.x - pan.x) / zoom;
        const worldY = (newCenter.y - pan.y) / zoom;

        // New pan to keep that world point at newCenter
        const newPanX = newCenter.x - worldX * newZoom;
        const newPanY = newCenter.y - worldY * newZoom;

        // Apply Zoom
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }

      // PAN (Refined by calculating difference in center movement)
      // Note: The zoom calculation above already applies some pan correction. 
      // If we purely want to pan based on center movement:
      // We essentially just updated pan based on zoom. Now we update based on movement.
      // But calculating both simultaneously is tricky.
      // 
      // Simplified approach for simultaneous Pan+Zoom:
      // 1. Calculate zoom change.
      // 2. Calculate how much the *center* moved.
      // 
      // Actually, the above zoom logic calculates "zoom around current center". 
      // Passively, if the user moves their fingers together (panning), the center moves, 
      // and the logic `newCenter.x - worldX * newZoom` *should* handle the pan implicitly.
      // Let's rely on that for now.

      touchStateRef.current.lastDistance = newDist;
      touchStateRef.current.lastCenter = newCenter;
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current = {
      ...touchStateRef.current,
      lastDistance: null,
      lastCenter: null,
      isPanning: false
    };
  };

  // Reset zoom and pan function
  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setIsMenuOpen(false);
  };

  const handleNewGameClick = () => {
    onRestart();
    setIsMenuOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden touch-none bg-gray-900"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Pieces */}
        {pieces.map(piece => (
          <PuzzlePiece
            key={piece.id}
            definition={PIECE_DEFINITIONS.find(d => d.id === piece.id)!}
            state={piece}
            imageUrl={imageUrl}
          />
        ))}

        {/* Mismatch Red Line */}
        {mismatchLine && (
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <line
              x1={mismatchLine.p1.x}
              y1={mismatchLine.p1.y}
              x2={mismatchLine.p2.x}
              y2={mismatchLine.p2.y}
              stroke="red"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="10,5"
            />
          </svg>
        )}
      </div>

      {/* UI HUD: Piece Count */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
          Pieces: {pieces.length} / {PIECE_DEFINITIONS.length}
        </span>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-50">
        {/* Home Button (Top Left) */}
        <button
          onClick={onHome}
          className="pointer-events-auto w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          title="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        </button>

        {/* Menu Button (Top Right) */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="pointer-events-auto w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
          title="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
        </button>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Game Menu</h2>

            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Continue
            </button>

            <div className="h-px bg-gray-600 my-2" />

            <button
              onClick={handleResetView}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
              Reset View
            </button>

            <button
              onClick={handleNewGameClick}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
              New Game
            </button>

            <button
              onClick={onHome}
              className="w-full py-4 bg-red-900/50 hover:bg-red-900/80 text-red-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 mt-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
              Quit to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};