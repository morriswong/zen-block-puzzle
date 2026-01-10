# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zen Block Puzzle is a React-based puzzle game where players arrange Tetris-like pieces to reconstruct a random image. The game features:
- An 8x8 grid divided into 16 predefined Tetris-shaped pieces
- Touch and mouse controls with pan/zoom viewport
- Piece grouping mechanics (pieces snap together when placed correctly)
- Batch-based piece spawning system for progressive difficulty
- Random image loading from Picsum
- PWA support with web manifest

## Commands

**Development:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
```

**Deployment:**
The app is configured to deploy to Cloudflare Pages via wrangler.toml:
```bash
npx wrangler pages deploy dist
```

## Architecture

### State Flow
The app uses a three-screen state machine managed in `App.tsx`:
- `start` -> `StartScreen` component
- `game` -> `Game` component (main gameplay)
- `end` -> `EndScreen` component

The `gameKey` state forces a new random image on each restart by triggering component remount.

### Modular Hook Architecture

The game logic has been refactored into specialized hooks:

**useGamePieces** (`hooks/useGamePieces.ts`):
- Manages piece state and batch progression
- Spawns pieces in batches of 5 for progressive gameplay
- Tracks completion status and progress metrics
- Triggers game completion when all pieces form one group

**useViewportTransform** (`hooks/useViewportTransform.ts`):
- Handles pan/zoom state for the game viewport
- Supports mouse wheel zoom and two-finger pinch gestures
- Provides `fitToView()` for auto-centering content
- Manages smooth animations during view transitions

**usePieceInteraction** (`hooks/usePieceInteraction.ts`):
- Handles drag/drop logic for puzzle pieces
- Manages group dragging (all pieces in a group move together)
- Detects neighbor snapping using `areNeighbors()` utility
- Shows mismatch lines when wrong pieces are brought close

**useGameMenu** (`hooks/useGameMenu.ts`):
- Simple state management for menu open/close

### Utility Functions

**pieceMath.ts** (`utils/pieceMath.ts`):
- `areNeighbors()`: Checks if two pieces should snap together based on their expected relative positions
- `getExpectedPosition()`: Calculates where a piece should be relative to another
- `worldToScreen()` / `screenToWorld()`: Coordinate transformations

**batchManager.ts** (`utils/batchManager.ts`):
- `generateBatchPieces()`: Creates new pieces with non-overlapping spawn positions
- `checkBatchCompletion()`: Determines if current batch is complete
- `findSpawnPosition()`: Finds valid spawn locations using circular placement

### Key Components

**Game.tsx**: Main game orchestrator that composes all hooks and renders:
- Frosted glass background with blurred image
- Viewport transform container with pieces
- Top bar with Home, HUD, and Menu buttons
- GameMenu overlay

**PuzzlePiece.tsx**: Renders individual pieces using CSS background positioning to show correct image fragments

**GameHUD.tsx**: Displays piece count and progress bar

**GameMenu.tsx**: Pause menu with Continue, Reset View, New Game, and Quit options

### Key Data Structures

**PieceDef** (constants.ts) - Solution state:
```typescript
{
  id: number;
  origin: Point;        // Grid position (0-7 cols, 0-7 rows)
  blocks: Point[];      // Shape defined as relative block positions
  width: number;        // Bounding box width in blocks
  height: number;       // Bounding box height in blocks
}
```

**PieceState** (types.ts) - Runtime state:
```typescript
{
  id: number;
  currentPos: Point;    // Pixel position in viewport
  targetPos: Point;     // Where piece should snap to
  isLocked: boolean;    // True when correctly placed
  zIndex: number;       // Rendering order
  groupId: number;      // Which group this piece belongs to
}
```

**BatchProgress** (hooks/useGamePieces.ts):
```typescript
{
  currentBatch: number;
  totalBatches: number;
  piecesPlaced: number;
  totalPieces: number;
  percentComplete: number;
  currentBatchSize: number;
}
```

## Important Implementation Details

1. **Coordinate Systems:**
   - Grid coordinates: 0-7 (columns/rows) in `PieceDef.origin`
   - Pixel coordinates: Used for rendering and dragging (`currentPos`, `targetPos`)
   - Conversion: `gridPos * BLOCK_SIZE` (where `BLOCK_SIZE = 100px`)

2. **Neighbor Detection:**
   The `areNeighbors()` function in `utils/pieceMath.ts` checks if two pieces are correctly positioned relative to each other by:
   - Computing expected relative distance from `PIECE_DEFINITIONS`
   - Comparing with actual relative distance
   - Allowing `SNAP_THRESHOLD` (50px) tolerance

3. **Group Merging:**
   When pieces snap together, groups merge by:
   - Setting all source group pieces to the target group's `groupId`
   - Adjusting positions so all pieces maintain correct relative positioning
   - Using the lower `groupId` as the merged group identifier

4. **Batch Spawning System:**
   - Pieces spawn in batches of 5 around the existing content
   - Uses circular placement algorithm with collision avoidance
   - Auto-fits view after each batch spawns
   - Triggers next batch when all current pieces merge into one group

5. **Image Loading:**
   - `getImageUrl()` generates fresh URL with `Date.now()` timestamp for cache-busting
   - Same image URL is passed to all pieces and background

6. **Viewport Interactions:**
   - Pan: Click/drag background or two-finger touch
   - Zoom: Scroll wheel (centered on cursor) or pinch gesture
   - Initial view: Auto-centers using `fitToView()`

## File Structure

```
App.tsx                          # Main app, screen routing
index.tsx                        # React root
types.ts                         # TypeScript interfaces (Point, PieceDef, PieceState)
constants.ts                     # Grid dimensions, piece definitions, image URL

components/
  Game.tsx                       # Core game orchestrator
  PuzzlePiece.tsx                # Individual piece rendering
  GameHUD.tsx                    # Progress display
  GameMenu.tsx                   # Pause menu overlay
  StartScreen.tsx                # Initial screen
  EndScreen.tsx                  # Victory screen

hooks/
  useGamePieces.ts               # Piece state and batch management
  usePieceInteraction.ts         # Drag/drop/snap logic
  useViewportTransform.ts        # Pan/zoom/animation
  useGameMenu.ts                 # Menu state

utils/
  pieceMath.ts                   # Geometry and neighbor detection
  batchManager.ts                # Piece spawning and completion checking

public/
  manifest.json                  # PWA manifest
```

## Development Conventions

1. **Styling**: Uses Tailwind CSS via CDN (loaded in index.html)
2. **State Management**: React hooks with useState/useRef - no external state library
3. **TypeScript**: Strict typing with interfaces in `types.ts`
4. **Imports**: Uses `@/` alias for root-level imports (configured in tsconfig.json and vite.config.ts)
5. **React Version**: React 19.x with modern features
6. **Build Tool**: Vite 6.x

## Environment

The app expects a `GEMINI_API_KEY` in `.env.local` (referenced in vite.config.ts but not currently used in the game logic).
