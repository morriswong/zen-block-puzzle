export interface Point {
  x: number;
  y: number;
}

export interface BlockDef {
  col: number; // 0-3
  row: number; // 0-3
}

export interface PieceDef {
  id: number;
  origin: Point; // Grid coordinates (col, row) of the top-left-most block relative to the grid
  blocks: Point[]; // Relative coordinates (x, y) from the piece origin
  width: number; // Width in blocks
  height: number; // Height in blocks
}

export interface PieceState {
  id: number;
  currentPos: Point; // Current pixel position on screen (top-left of bounding box)
  targetPos: Point; // Target pixel position on screen (snap target)
  isLocked: boolean;
  zIndex: number;
  groupId: number; // ID of the group this piece belongs to
}
