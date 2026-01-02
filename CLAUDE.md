# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zen Block Puzzle is a React-based puzzle game where players arrange Tetris-like pieces to reconstruct a random image. The game features:
- An 8x8 grid divided into 16 predefined Tetris-shaped pieces
- Touch and mouse controls with pan/zoom viewport
- Piece grouping mechanics (pieces snap together when placed correctly)
- Random image loading from Picsum

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
- `start` → `StartScreen` component
- `game` → `Game` component (main gameplay)
- `end` → `EndScreen` component

The `gameKey` state forces a new random image on each restart by triggering component remount.

### Core Game Mechanics (components/Game.tsx)

**Piece Management:**
- Pieces are initialized from `PIECE_DEFINITIONS` in `constants.ts` with randomized positions
- Each piece has both `currentPos` (actual position) and `targetPos` (snap position)
- Pieces belong to a `groupId` which enables "welding" - when two correctly-positioned pieces snap together, they move as one unit

**Grouping System:**
The key innovation is the piece grouping mechanism:
1. When dragging a piece, check if it's near any other pieces using `areNeighbors()`
2. If pieces match their expected relative position (within `SNAP_THRESHOLD`), merge their groups
3. All pieces in a group move together using `groupOffsets` stored in `dragRef`
4. Groups are identified by the lowest piece ID in the group (using Union-Find pattern via `parentMap`)

**Viewport Controls:**
- Pan: Click/drag background or two-finger touch
- Zoom: Scroll wheel or pinch gesture
- Initial view: Auto-centers and scales to fit all pieces using `fitToView()`

### Key Data Structures

**PieceDef (constants.ts):**
Defines the "solution" state - each piece's position in the completed puzzle:
```typescript
{
  id: number;
  origin: Point;        // Grid position (0-7 cols, 0-7 rows)
  blocks: Point[];      // Shape defined as relative block positions
  width: number;        // Bounding box width in blocks
  height: number;       // Bounding box height in blocks
}
```

**PieceState (types.ts):**
Runtime state of each piece:
```typescript
{
  id: number;
  currentPos: Point;    // Pixel position in viewport
  targetPos: Point;     // Where piece should snap to (initially randomized)
  isLocked: boolean;    // True when correctly placed
  zIndex: number;       // Rendering order
  groupId: number;      // Which group this piece belongs to
}
```

### Important Implementation Details

1. **Coordinate Systems:**
   - Grid coordinates: 0-7 (columns/rows) in `PieceDef.origin`
   - Pixel coordinates: Used for rendering and dragging (`currentPos`, `targetPos`)
   - Conversion: `gridPos * BLOCK_SIZE` (where `BLOCK_SIZE = 100px`)

2. **Neighbor Detection:**
   The `areNeighbors()` function checks if two pieces are correctly positioned relative to each other by:
   - Computing expected relative distance from `PIECE_DEFINITIONS`
   - Comparing with actual relative distance
   - Allowing `SNAP_THRESHOLD` (50px) tolerance

3. **Group Merging:**
   When pieces snap together, groups merge by:
   - Finding the "root" group ID for each piece (lowest ID in connected group)
   - Unioning the groups by updating all members to share the same root
   - Recalculating positions so all pieces maintain correct relative positioning

4. **Image Loading:**
   Each new game generates a fresh image URL with `Date.now()` timestamp to bypass caching

## File Structure

```
App.tsx                    # Main app, screen routing
components/
  Game.tsx                 # Core game logic (800+ lines)
  PuzzlePiece.tsx          # Individual piece rendering
  StartScreen.tsx          # Initial screen
  EndScreen.tsx            # Victory screen
types.ts                   # TypeScript interfaces
constants.ts               # Grid dimensions, piece definitions
index.tsx                  # React root
```

## Environment

The app expects a `GEMINI_API_KEY` in `.env.local` (referenced in vite.config.ts but not currently used in the game logic).
