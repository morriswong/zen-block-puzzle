import { useState, useCallback, useRef } from 'react';
import { PieceState, Point, PieceDef } from '../types';
import { BLOCK_SIZE } from '../constants';

export interface UseViewportTransformReturn {
  pan: Point;
  setPan: React.Dispatch<React.SetStateAction<Point>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  isAnimating: boolean;
  fitToView: (pieces: PieceState[]) => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  resetView: () => void;
  panStartRef: React.MutableRefObject<{ x: number; y: number }>;
  touchStateRef: React.MutableRefObject<{
    touches: Map<number, { x: number; y: number }>;
    lastDistance: number | null;
    lastCenter: { x: number; y: number } | null;
    isPanning: boolean;
    panStart: { x: number; y: number } | null;
  }>;
}

interface UseViewportTransformProps {
  pieceDefinitions: PieceDef[];
}

const PADDING = 100;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

/**
 * Hook for managing viewport pan/zoom/animation state
 */
export const useViewportTransform = ({
  pieceDefinitions
}: UseViewportTransformProps): UseViewportTransformReturn => {
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const panStartRef = useRef({ x: 0, y: 0 });
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

  /**
   * Fit view to show all pieces
   */
  const fitToView = useCallback((currentPieces: PieceState[]) => {
    if (currentPieces.length === 0) return;

    // Calculate bounds of all pieces
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    currentPieces.forEach(p => {
      const def = pieceDefinitions.find(d => d.id === p.id);
      const w = (def?.width || 1) * BLOCK_SIZE;
      const h = (def?.height || 1) * BLOCK_SIZE;

      minX = Math.min(minX, p.currentPos.x);
      minY = Math.min(minY, p.currentPos.y);
      maxX = Math.max(maxX, p.currentPos.x + w);
      maxY = Math.max(maxY, p.currentPos.y + h);
    });

    // Add padding
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
    targetZoom = Math.max(MIN_ZOOM, Math.min(2.0, targetZoom));

    // Calculate Pan to center the content
    const targetPanX = (viewW / 2) - (contentCenterX * targetZoom);
    const targetPanY = (viewH / 2) - (contentCenterY * targetZoom);

    // Animate
    setIsAnimating(true);
    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });

    // Reset animation flag after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  }, [pieceDefinitions]);

  /**
   * Handle mouse wheel zoom
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * delta));

    if (newZoom !== zoom) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomPointX = (mouseX - pan.x) / zoom;
      const zoomPointY = (mouseY - pan.y) / zoom;

      setPan({
        x: mouseX - zoomPointX * newZoom,
        y: mouseY - zoomPointY * newZoom,
      });
      setZoom(newZoom);
    }
  }, [zoom, pan]);

  /**
   * Touch helpers
   */
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getTouchCenter = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  /**
   * Handle touch start (for pinch-to-zoom and two-finger pan)
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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
  }, [pan]);

  /**
   * Handle touch move (pinch-to-zoom and two-finger pan)
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      const newDist = getTouchDistance(t1, t2);
      const newCenter = getTouchCenter(t1, t2);

      // ZOOM
      if (touchStateRef.current.lastDistance) {
        const delta = newDist / touchStateRef.current.lastDistance;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * delta));

        // Adjust pan to zoom towards center
        const worldX = (newCenter.x - pan.x) / zoom;
        const worldY = (newCenter.y - pan.y) / zoom;

        // New pan to keep that world point at newCenter
        const newPanX = newCenter.x - worldX * newZoom;
        const newPanY = newCenter.y - worldY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }

      touchStateRef.current.lastDistance = newDist;
      touchStateRef.current.lastCenter = newCenter;
    }
  }, [zoom, pan]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(() => {
    touchStateRef.current = {
      ...touchStateRef.current,
      lastDistance: null,
      lastCenter: null,
      isPanning: false
    };
  }, []);

  /**
   * Reset view to default
   */
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  return {
    pan,
    setPan,
    zoom,
    setZoom,
    isPanning,
    setIsPanning,
    isAnimating,
    fitToView,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    panStartRef,
    touchStateRef
  };
};
