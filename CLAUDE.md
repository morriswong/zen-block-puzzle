# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zen Puzzles is a React-based puzzle game collection. Currently features:
- **8 Puzzle**: Classic sliding tile puzzle with a 3x3 grid (8 tiles + 1 empty space)
- Random image loading from Picsum
- Mobile-friendly tap-to-slide controls
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

### 8 Puzzle Game Logic

**useSlidingPuzzle** (`hooks/useSlidingPuzzle.ts`):
- Manages board state as array of 9 values (0-7 tiles + 8 for empty)
- Handles tile movement validation (only adjacent to empty can move)
- Ensures shuffled puzzles are solvable using inversion counting
- Tracks move count and completion status

**useGameMenu** (`hooks/useGameMenu.ts`):
- Simple state management for menu open/close

### Key Components

**Game.tsx**: Main game orchestrator that:
- Renders a centered 3x3 grid
- Handles tile click events
- Shows frosted glass background with blurred image
- Displays move counter in top bar
- Manages menu overlay

**Tile.tsx**: Renders individual tiles using CSS background positioning to show correct image fragments

**GameMenu.tsx**: Pause menu with Continue, Shuffle, New Image, and Quit options

### Key Data Structures

**BoardState** (types.ts):
```typescript
// Array of 9 values: [0-7] = image tiles, 8 = empty space
// Index represents position in 3x3 grid:
// [0, 1, 2]  = top row
// [3, 4, 5]  = middle row
// [6, 7, 8]  = bottom row
type BoardState = number[];
```

**GameProgress** (types.ts):
```typescript
{
  moves: number;
  isSolved: boolean;
}
```

## Important Implementation Details

1. **Coordinate System:**
   - Position index = row * 3 + col (0-8)
   - Tile value determines which part of image to show
   - Grid size: 3x3, Image size: 600px, Tile size: 200px

2. **Move Validation:**
   Tiles can only move if adjacent (not diagonal) to the empty space:
   - Same row, column differs by 1
   - Same column, row differs by 1

3. **Solvability:**
   The puzzle ensures solvability by counting inversions:
   - For 3x3 puzzle, solvable if inversion count is even
   - Reshuffles automatically if generated puzzle is unsolvable

4. **Image Loading:**
   - `getImageUrl()` generates fresh URL with `Date.now()` timestamp for cache-busting
   - Same image URL is passed to all tiles and background

## File Structure

```
App.tsx                          # Main app, screen routing
index.tsx                        # React root
types.ts                         # TypeScript interfaces (BoardState, GameProgress)
constants.ts                     # Grid dimensions, image URL

components/
  Game.tsx                       # Core game orchestrator
  Tile.tsx                       # Individual tile rendering
  GameMenu.tsx                   # Pause menu overlay
  StartScreen.tsx                # Home screen with game selection
  EndScreen.tsx                  # Victory screen
  ComingSoonModal.tsx            # Modal for upcoming features

hooks/
  useSlidingPuzzle.ts            # 8 puzzle game logic
  useGameMenu.ts                 # Menu state

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
